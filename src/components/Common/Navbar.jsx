import { NavLink, useLocation } from 'react-router-dom';
import { Home, MapPin, Scale, User } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    // Don't show navbar on auth pages
    if (['/login', '/register'].includes(location.pathname)) {
        return null;
    }

    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/track', icon: MapPin, label: 'Track' },
        { to: '/legal', icon: Scale, label: 'Legal' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className="nav-bottom">
            {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    <Icon size={24} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default Navbar;
