// Stand-in for a real third-party script (analytics, a chat widget, an embed...).
// In the demo it just proves it only ever runs after consent is accepted.
document.getElementById('demo-status').textContent =
	'✅ Demo script loaded (this only runs after you accept).';
