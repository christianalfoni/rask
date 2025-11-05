// JSX type definitions
// Note: This is JSXInternal, which gets renamed to JSX on export from jsx-runtime
import type { Ref } from './state';

export namespace JSXInternal {
  export type Element = any;

  export interface ElementAttributesProperty {
    props: {};
  }

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicAttributes {
    key?: any;
  }

  // CSS Properties
  export type CSSProperties = {
    [key: string]: string | number | undefined;
  };

  // Common HTML Attributes
  export interface HTMLAttributes<T = HTMLElement> {
    ref?: Ref<T> | ((element: T | null) => void);
    id?: string;
    className?: string;
    class?: string;
    style?: string | CSSProperties;
    title?: string;
    role?: string;
    tabIndex?: number;

    onClick?: (event: MouseEvent) => void;
    onDblClick?: (event: MouseEvent) => void;
    onChange?: (event: Event) => void;
    onInput?: (event: Event) => void;
    onSubmit?: (event: Event) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onKeyPress?: (event: KeyboardEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseOut?: (event: MouseEvent) => void;
    onWheel?: (event: WheelEvent) => void;
    onScroll?: (event: Event) => void;
    onTouchStart?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchCancel?: (event: TouchEvent) => void;

    [key: `aria-${string}`]: string | boolean | number | undefined;
    [key: `data-${string}`]: string | boolean | number | undefined;

    children?: any;
  }

  export interface AnchorHTMLAttributes<T = HTMLAnchorElement>
    extends HTMLAttributes<T> {
    href?: string;
    target?: "_blank" | "_self" | "_parent" | "_top";
    rel?: string;
    download?: string;
  }

  export interface ButtonHTMLAttributes<T = HTMLButtonElement>
    extends HTMLAttributes<T> {
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    name?: string;
    value?: string;
  }

  export interface FormHTMLAttributes<T = HTMLFormElement>
    extends HTMLAttributes<T> {
    action?: string;
    method?: "get" | "post";
    enctype?: string;
    target?: string;
    noValidate?: boolean;
  }

  export interface InputHTMLAttributes<T = HTMLInputElement>
    extends HTMLAttributes<T> {
    type?:
      | "button"
      | "checkbox"
      | "color"
      | "date"
      | "datetime-local"
      | "email"
      | "file"
      | "hidden"
      | "image"
      | "month"
      | "number"
      | "password"
      | "radio"
      | "range"
      | "reset"
      | "search"
      | "submit"
      | "tel"
      | "text"
      | "time"
      | "url"
      | "week";
    value?: string | number;
    defaultValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    name?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    pattern?: string;
    accept?: string;
    multiple?: boolean;
    autoComplete?: string;
    autoFocus?: boolean;
  }

  export interface LabelHTMLAttributes<T = HTMLLabelElement>
    extends HTMLAttributes<T> {
    htmlFor?: string;
    for?: string;
  }

  export interface SelectHTMLAttributes<T = HTMLSelectElement>
    extends HTMLAttributes<T> {
    value?: string | string[];
    defaultValue?: string | string[];
    disabled?: boolean;
    required?: boolean;
    name?: string;
    multiple?: boolean;
    size?: number;
  }

  export interface OptionHTMLAttributes<T = HTMLOptionElement>
    extends HTMLAttributes<T> {
    value?: string | number;
    selected?: boolean;
    disabled?: boolean;
    label?: string;
  }

  export interface TextareaHTMLAttributes<T = HTMLTextAreaElement>
    extends HTMLAttributes<T> {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    name?: string;
    rows?: number;
    cols?: number;
    maxLength?: number;
    wrap?: "soft" | "hard";
  }

  export interface FieldsetHTMLAttributes<T = HTMLFieldSetElement>
    extends HTMLAttributes<T> {
    disabled?: boolean;
    name?: string;
  }

  export interface ImgHTMLAttributes<T = HTMLImageElement>
    extends HTMLAttributes<T> {
    src?: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    loading?: "eager" | "lazy";
    crossOrigin?: "anonymous" | "use-credentials";
  }

  export interface SVGAttributes<T = SVGElement> extends HTMLAttributes<T> {
    xmlns?: string;
    viewBox?: string;
    width?: number | string;
    height?: number | string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
  }

  // Intrinsic Elements
  export interface IntrinsicElements {
    a: AnchorHTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    b: HTMLAttributes<HTMLElement>;
    blockquote: HTMLAttributes<HTMLQuoteElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: ButtonHTMLAttributes<HTMLButtonElement>;
    canvas: HTMLAttributes<HTMLCanvasElement>;
    code: HTMLAttributes<HTMLElement>;
    div: HTMLAttributes<HTMLDivElement>;
    em: HTMLAttributes<HTMLElement>;
    fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: FormHTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    img: ImgHTMLAttributes<HTMLImageElement>;
    input: InputHTMLAttributes<HTMLInputElement>;
    label: LabelHTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: HTMLAttributes<HTMLLIElement>;
    main: HTMLAttributes<HTMLElement>;
    nav: HTMLAttributes<HTMLElement>;
    ol: HTMLAttributes<HTMLOListElement>;
    option: OptionHTMLAttributes<HTMLOptionElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    section: HTMLAttributes<HTMLElement>;
    select: SelectHTMLAttributes<HTMLSelectElement>;
    small: HTMLAttributes<HTMLElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: HTMLAttributes<HTMLStyleElement>;
    textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;
    ul: HTMLAttributes<HTMLUListElement>;

    // SVG
    svg: SVGAttributes<SVGSVGElement>;
    circle: SVGAttributes<SVGCircleElement>;
    line: SVGAttributes<SVGLineElement>;
    path: SVGAttributes<SVGPathElement>;
    rect: SVGAttributes<SVGRectElement>;
  }
}
