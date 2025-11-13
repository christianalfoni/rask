use swc_core::ecma::{
    ast::*,
    atoms::Wtf8Atom,
    utils::{private_ident, quote_ident},
    visit::{noop_visit_mut_type, VisitMut, VisitMutWith},
};
use swc_core::plugin::{plugin_transform, proxies::TransformPluginProgramMetadata};

#[derive(Default, Clone, serde::Deserialize)]
#[serde(crate = "serde")]
pub struct Config {
    #[serde(default, rename = "importSource")]
    pub import_source: Option<String>,
}

pub struct RaskComponentTransform {
    config: Config,
    import_rask_component: Option<Ident>,
}

impl RaskComponentTransform {
    fn new(config: Config) -> Self {
        RaskComponentTransform {
            config,
            import_rask_component: None,
        }
    }

    /// Check if an expression contains a VNode-related call (recursive deep search)
    fn has_vnode_call(&self, expr: &Expr) -> bool {
        match expr {
            // Direct VNode call - this is what we're looking for
            Expr::Call(call) => {
                if let Callee::Expr(callee_expr) = &call.callee {
                    if let Expr::Ident(ident) = &**callee_expr {
                        if ident.sym.as_ref() == "createVNode"
                            || ident.sym.as_ref() == "createComponentVNode"
                            || ident.sym.as_ref() == "createFragment"
                            || ident.sym.as_ref() == "createTextVNode"
                        {
                            return true;
                        }
                    }
                }
                // Check arguments - important for .map(...), .filter(...), etc.
                for arg in &call.args {
                    if self.has_vnode_call(&arg.expr) {
                        return true;
                    }
                }
                false
            }
            // Parenthesized expressions
            Expr::Paren(paren) => self.has_vnode_call(&paren.expr),

            // Conditional (ternary): condition ? consequent : alternate
            Expr::Cond(cond) => {
                self.has_vnode_call(&cond.cons) || self.has_vnode_call(&cond.alt)
            }

            // Logical: expr1 && expr2, expr1 || expr2
            Expr::Bin(bin) => {
                self.has_vnode_call(&bin.left) || self.has_vnode_call(&bin.right)
            }

            // Arrays: [expr1, expr2, ...]
            Expr::Array(arr) => {
                arr.elems.iter().any(|elem| {
                    elem.as_ref()
                        .map(|e| self.has_vnode_call(&e.expr))
                        .unwrap_or(false)
                })
            }

            // Arrow functions: (args) => body
            Expr::Arrow(arrow) => match &*arrow.body {
                BlockStmtOrExpr::Expr(expr) => self.has_vnode_call(expr),
                BlockStmtOrExpr::BlockStmt(block) => {
                    for stmt in &block.stmts {
                        if let Stmt::Return(ret) = stmt {
                            if let Some(arg) = &ret.arg {
                                if self.has_vnode_call(arg) {
                                    return true;
                                }
                            }
                        }
                    }
                    false
                }
            },

            // Member expressions: obj.method()
            Expr::Member(member) => self.has_vnode_call(&member.obj),

            // Unary expressions: !expr, +expr, etc.
            Expr::Unary(unary) => self.has_vnode_call(&unary.arg),

            // JSX/Fragments - already transformed by Inferno plugin, so we won't see these
            _ => false,
        }
    }

    /// Check if a function body returns an arrow function with VNode calls
    fn is_rask_component(&self, func: &Function) -> bool {
        if let Some(body) = &func.body {
            for stmt in &body.stmts {
                if let Stmt::Return(ret_stmt) = stmt {
                    if let Some(ret_arg) = &ret_stmt.arg {
                        // Check if returning arrow function
                        if let Expr::Arrow(arrow) = &**ret_arg {
                            // Check arrow body for VNode calls
                            match &*arrow.body {
                                BlockStmtOrExpr::Expr(expr) => {
                                    if self.has_vnode_call(expr) {
                                        return true;
                                    }
                                }
                                BlockStmtOrExpr::BlockStmt(block) => {
                                    for stmt in &block.stmts {
                                        if let Stmt::Return(inner_ret) = stmt {
                                            if let Some(inner_arg) = &inner_ret.arg {
                                                if self.has_vnode_call(inner_arg) {
                                                    return true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        false
    }

    /// Transform a function declaration to a RaskComponent class
    fn transform_to_class(&mut self, name: Ident, func: Function) -> Decl {
        // Ensure we have the RaskComponent import
        if self.import_rask_component.is_none() {
            self.import_rask_component = Some(private_ident!("RaskComponent"));
        }

        let super_class_ident = self.import_rask_component.as_ref().unwrap().clone();

        // Create the class property: setup = function name() { ... }
        let setup_prop = ClassMember::ClassProp(ClassProp {
            span: Default::default(),
            key: PropName::Ident(quote_ident!("setup").into()),
            value: Some(Box::new(Expr::Fn(FnExpr {
                ident: Some(name.clone()),
                function: Box::new(func),
            }))),
            type_ann: None,
            is_static: false,
            decorators: vec![],
            accessibility: None,
            is_abstract: false,
            is_optional: false,
            is_override: false,
            readonly: false,
            declare: false,
            definite: false,
        });

        Decl::Class(ClassDecl {
            ident: name,
            declare: false,
            class: Box::new(Class {
                span: Default::default(),
                ctxt: Default::default(),
                decorators: vec![],
                body: vec![setup_prop],
                super_class: Some(Box::new(Expr::Ident(super_class_ident))),
                is_abstract: false,
                type_params: None,
                super_type_params: None,
                implements: vec![],
            }),
        })
    }

    /// Inject the RaskComponent import at the top of the module
    fn inject_runtime(&mut self, module: &mut Module) {
        if self.import_rask_component.is_none() {
            return;
        }

        let import_source = self
            .config
            .import_source
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("rask-ui");

        let rask_component_ident = self.import_rask_component.as_ref().unwrap();

        // Check if import already exists
        for item in &module.body {
            if let ModuleItem::ModuleDecl(ModuleDecl::Import(import)) = item {
                if &*import.src.value == import_source {
                    for spec in &import.specifiers {
                        if let ImportSpecifier::Named(named) = spec {
                            if let Some(ModuleExportName::Ident(imported)) = &named.imported {
                                if &*imported.sym == "RaskComponent" {
                                    return; // Import already exists
                                }
                            } else if &*named.local.sym == "RaskComponent" {
                                return; // Import already exists
                            }
                        }
                    }
                }
            }
        }

        // Create new import
        let import = ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl {
            span: Default::default(),
            specifiers: vec![ImportSpecifier::Named(ImportNamedSpecifier {
                span: Default::default(),
                local: rask_component_ident.clone(),
                imported: Some(ModuleExportName::Ident(quote_ident!("RaskComponent").into())),
                is_type_only: false,
            })],
            src: Box::new(Str {
                span: Default::default(),
                value: Wtf8Atom::from(import_source),
                raw: None,
            }),
            type_only: false,
            with: None,
            phase: Default::default(),
        }));

        module.body.insert(0, import);
    }
}

impl VisitMut for RaskComponentTransform {
    noop_visit_mut_type!();

    fn visit_mut_module(&mut self, module: &mut Module) {
        // First visit all items to transform them
        module.visit_mut_children_with(self);

        // Then inject imports if needed
        self.inject_runtime(module);
    }

    fn visit_mut_module_item(&mut self, item: &mut ModuleItem) {
        match item {
            ModuleItem::Stmt(Stmt::Decl(Decl::Fn(fn_decl))) => {
                // Check if this function should be transformed
                if self.is_rask_component(&fn_decl.function) {
                    let name = fn_decl.ident.clone();
                    let func = (*fn_decl.function).clone();
                    let class_decl = self.transform_to_class(name, func);
                    *item = ModuleItem::Stmt(Stmt::Decl(class_decl));
                    return;
                }
            }
            ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(export)) => {
                // Handle: export default function() { return () => <div /> }
                if let DefaultDecl::Fn(fn_expr) = &mut export.decl {
                    if self.is_rask_component(&fn_expr.function) {
                        // For default exports, we need to keep it as a function expression
                        // but transform the pattern internally if needed
                        // For now, we'll skip transforming default exports
                        // as they need special handling
                    }
                }
            }
            ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(export)) => {
                // Handle: export function MyComponent() { return () => <div /> }
                if let Decl::Fn(fn_decl) = &mut export.decl {
                    if self.is_rask_component(&fn_decl.function) {
                        let name = fn_decl.ident.clone();
                        let func = (*fn_decl.function).clone();
                        let class_decl = self.transform_to_class(name, func);
                        export.decl = class_decl;
                        return;
                    }
                }
            }
            _ => {}
        }

        item.visit_mut_children_with(self);
    }
}

#[plugin_transform]
pub fn process_transform(mut program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    let config = serde_json::from_str::<Config>(
        &metadata
            .get_transform_plugin_config()
            .unwrap_or_else(|| "{}".to_string()),
    )
    .unwrap_or_default();

    program.visit_mut_with(&mut RaskComponentTransform::new(config));
    program
}
