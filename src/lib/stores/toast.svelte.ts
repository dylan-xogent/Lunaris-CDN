export type Toast = {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	message: string;
};

function createToastStore() {
	let items = $state<Toast[]>([]);

	function add(type: Toast['type'], message: string) {
		const id = crypto.randomUUID();
		items = [...items, { id, type, message }];

		setTimeout(() => {
			dismiss(id);
		}, 5000);
	}

	function dismiss(id: string) {
		items = items.filter((t) => t.id !== id);
	}

	return {
		get toasts() {
			return items;
		},
		success(message: string) {
			add('success', message);
		},
		error(message: string) {
			add('error', message);
		},
		warning(message: string) {
			add('warning', message);
		},
		info(message: string) {
			add('info', message);
		},
		dismiss
	};
}

export const toast = createToastStore();

export const toasts = {
	get current() {
		return toast.toasts;
	}
};
