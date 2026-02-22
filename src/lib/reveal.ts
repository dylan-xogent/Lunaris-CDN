/** Svelte action: adds 'visible' class when element enters viewport */
export function reveal(node: HTMLElement, options?: { threshold?: number }) {
	const threshold = options?.threshold ?? 0.15;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add('visible');
					observer.unobserve(entry.target);
				}
			}
		},
		{ threshold, rootMargin: '0px 0px -40px 0px' }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}

/** Svelte action: animates a number counting up when element enters viewport */
export function countUp(node: HTMLElement, options: { target: number; duration?: number; suffix?: string; prefix?: string }) {
	const { target, duration = 2000, suffix = '', prefix = '' } = options;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					animate();
					observer.unobserve(entry.target);
				}
			}
		},
		{ threshold: 0.3 }
	);

	function animate() {
		const start = performance.now();
		const step = (now: number) => {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			// Ease out cubic
			const eased = 1 - Math.pow(1 - progress, 3);
			const current = Math.round(eased * target);
			node.textContent = prefix + current.toLocaleString() + suffix;
			if (progress < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	node.textContent = prefix + '0' + suffix;
	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}
