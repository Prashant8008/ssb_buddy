const themeToggle = document.querySelector('[data-theme-toggle]');
const savedTheme = localStorage.getItem('ssb-theme');
if (savedTheme === 'dark') document.documentElement.classList.add('dark');
themeToggle?.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('ssb-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

document.querySelectorAll('[data-api-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const endpoint = form.getAttribute('data-api-form');
    const method = form.getAttribute('method') || 'POST';
    const formData = new FormData(form);
    const response = await fetch(endpoint, { method, body: formData });
    const target = form.querySelector('[data-form-status]');
    if (target) target.textContent = response.ok ? 'Saved successfully.' : 'Please check the form and try again.';
  });
});
