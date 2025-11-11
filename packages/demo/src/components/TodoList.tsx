import { TodoItem } from "./TodoItem";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

export function TodoList(props: TodoListProps) {
  return () => (
    <div>
      {props.todos.length === 0 ? (
        <div class="text-center py-12 text-gray-400">
          <p class="text-lg">No todos yet!</p>
          <p class="text-sm mt-2">Add one above to get started.</p>
        </div>
      ) : (
        <ul class="space-y-2">
          {props.todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={props.onToggle}
              onDelete={props.onDelete}
              onEdit={props.onEdit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
