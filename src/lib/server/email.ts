interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(apiKey: string, options: SendEmailOptions) {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			from: 'Lunaris CDN <noreply@lunaris.win>',
			to: options.to,
			subject: options.subject,
			html: options.html
		})
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Failed to send email:', error);
		throw new Error(`Failed to send email: ${response.status}`);
	}

	return response.json();
}
