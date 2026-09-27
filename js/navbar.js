/* navbar.js — injects the shared sidebar/nav into any page with a
 * <div id="app-nav"></div> placeholder, and highlights the current page.
 */

function renderNavbar() {
  const host = document.getElementById('app-nav');
  if (!host) return;

  const links = [
    { href: 'index.html', label: 'Dashboard', icon: '◧' },
    { href: 'transactions.html', label: 'รายการทั้งหมด', icon: '≡' },
    { href: 'add.html', label: 'เพิ่มรายการ', icon: '+' },
    { href: 'upload-slip.html', label: 'อัปโหลดสลิป', icon: '⇪' },
  ];

  const current = window.location.pathname.split('/').pop() || 'index.html';

  host.innerHTML = `
    <div class="brand">
      <span class="brand__mark">฿</span>
      <span class="brand__text">บันทึกรายรับ–รายจ่าย</span>
    </div>
    <nav class="nav-links">
      ${links
        .map(
          (l) => `
        <a class="nav-link${l.href === current ? ' nav-link--active' : ''}" href="${l.href}">
          <span class="nav-link__icon">${l.icon}</span>
          <span>${l.label}</span>
        </a>`
        )
        .join('')}
    </nav>
  `;
}

document.addEventListener('DOMContentLoaded', renderNavbar);
