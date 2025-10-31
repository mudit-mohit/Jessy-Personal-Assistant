import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar-glass">
      {navItems.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          label={label}
          active={location.pathname === to}
        />
      ))}
    </nav>
  );
};

const navItems = [
  { to: '/', label: '🏠 Home' }, 
  { to: '/health', label: '🩺 Health' }, 
  { to: '/vitals', label: '📈 Vitals' }, 
  { to: '/clone', label: '💬 Clone' },
  { to: '/memory', label: '🧠 Memory' },
  { to: '/opponent', label: '⚖️ Opponent'},
  { to: '/review-feedback', label: '📝 Feedbacks'},
  { to: '/calmlogs', label: '🧘 Calm Logs'},
  { to: '/vitals-logs', label: '📘 Vitals Logs'},
];

const NavLink = ({ to, label, active }) => (
  <Link
    to={to}
    className={`navbar-link${active ? ' active' : ''}`}
  >
    {label}
  </Link>
);

export default Navbar;