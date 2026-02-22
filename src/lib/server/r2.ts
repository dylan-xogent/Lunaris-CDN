export async function deleteR2Object(bucket: R2Bucket, key: string) {
	await bucket.delete(key);
}

export async function deleteR2Objects(bucket: R2Bucket, keys: string[]) {
	if (keys.length === 0) return;
	// R2 delete supports up to 1000 keys at a time
	const batches = [];
	for (let i = 0; i < keys.length; i += 1000) {
		batches.push(keys.slice(i, i + 1000));
	}
	await Promise.all(batches.map((batch) => bucket.delete(batch)));
}
