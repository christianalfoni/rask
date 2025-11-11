import { createState } from "rask-ui";

interface TodoItemProps {
  todo: {
    id: string;
    text: string;
    completed: boolean;
  };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

export function TodoItem(props: TodoItemProps) {
  const state = createState({
    isEditing: false,
    editText: props.todo.text,
  });

  const startEditing = () => {
    state.isEditing = true;
    state.editText = props.todo.text;
  };

  const saveEdit = () => {
    if (state.editText.trim()) {
      props.onEdit(props.todo.id, state.editText.trim());
      state.isEditing = false;
    }
  };

  const cancelEdit = () => {
    state.isEditing = false;
    state.editText = props.todo.text;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return () => (
    <li class="group flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {state.isEditing ? (
        <div class="flex-1 flex gap-2">
          <input
            type="text"
            value={state.editText}
            onInput={(e) => (state.editText = (e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            class="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={saveEdit}
            class="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={cancelEdit}
            class="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <input
            type="checkbox"
            checked={props.todo.completed}
            onChange={() => props.onToggle(props.todo.id)}
            class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <span
            class={`flex-1 text-left ${
              props.todo.completed
                ? "line-through text-gray-400"
                : "text-gray-800"
            }`}
            onDblClick={startEditing}
          >
            {props.todo.text}
          </span>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={startEditing}
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => props.onDelete(props.todo.id)}
              class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
}
