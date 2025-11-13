import { createState, createView } from "rask-ui";
import { TodoInput } from "./TodoInput";
import { TodoFilters, type FilterType } from "./TodoFilters";
import { TodoList } from "./TodoList";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

function Header() {
  return (
    <header class="mb-8">
      <h1 class="text-4xl font-bold text-center text-gray-800 mb-2">
        📝 RASK Todo
      </h1>
      <p class="text-center text-gray-500 text-sm">
        A reactive todo app built with RASK UI
      </p>
    </header>
  );
}

export function TodoApp() {
  const state = createState<{
    todos: Todo[];
    filter: FilterType;
  }>({
    todos: [
      {
        id: "1",
        text: "Welcome to RASK Todo App! 🎉",
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: "2",
        text: "Double-click to edit a todo",
        completed: false,
        createdAt: Date.now(),
      },
      {
        id: "3",
        text: "Hover over todos to see actions",
        completed: false,
        createdAt: Date.now(),
      },
    ],
    filter: "all",
  });

  const addTodo = (text: string) => {
    state.todos.push({
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    });
  };

  const toggleTodo = (id: string) => {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  const deleteTodo = (id: string) => {
    const index = state.todos.findIndex((t) => t.id === id);
    if (index !== -1) {
      state.todos.splice(index, 1);
    }
  };

  const editTodo = (id: string, newText: string) => {
    const todo = state.todos.find((t) => t.id === id);
    if (todo) {
      todo.text = newText;
    }
  };

  const changeFilter = (filter: FilterType) => {
    state.filter = filter;
  };

  const getFilteredTodos = () => {
    switch (state.filter) {
      case "active":
        return state.todos.filter((t) => !t.completed);
      case "completed":
        return state.todos.filter((t) => t.completed);
      default:
        return state.todos;
    }
  };

  const getStats = () => {
    const total = state.todos.length;
    const completed = state.todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, completed, active };
  };

  const view = createView(state, {
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    changeFilter,
    getFilteredTodos,
    getStats,
  });

  return () => (
    <div class="w-full max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <Header />

        <TodoInput onAdd={view.addTodo} />

        <TodoFilters
          currentFilter={view.filter}
          onFilterChange={view.changeFilter}
          activeCount={view.getStats().active}
          completedCount={view.getStats().completed}
          totalCount={view.getStats().total}
        />

        <TodoList
          todos={view.getFilteredTodos()}
          onToggle={view.toggleTodo}
          onDelete={view.deleteTodo}
          onEdit={view.editTodo}
        />

        {view.getStats().total > 0 && (
          <footer class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex justify-between items-center text-sm text-gray-500">
              <span>
                {view.getStats().active === 0
                  ? "All tasks completed! 🎉"
                  : `${view.getStats().active} ${
                      view.getStats().active === 1 ? "task" : "tasks"
                    } remaining`}
              </span>
              {view.getStats().completed > 0 && (
                <button
                  onClick={() => {
                    state.todos = state.todos.filter((t) => !t.completed);
                  }}
                  class="text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear completed
                </button>
              )}
            </div>
          </footer>
        )}
      </div>

      <footer class="mt-8 text-center text-sm text-gray-500">
        <p>
          Click checkbox to complete • Double-click to edit • Hover for actions
        </p>
      </footer>
    </div>
  );
}
