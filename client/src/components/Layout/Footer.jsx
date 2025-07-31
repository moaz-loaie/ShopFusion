import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn
} from 'react-icons/fa';

const Footer = () => {
  const [email, setEmail] = useState('');
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Here you would typically call an API to handle the subscription

      setEmail('');
    }
  };

  const navigation = {
    shop: [
      { name: 'Products', href: '/products' },
      { name: 'Categories', href: '/categories' },
      { name: 'Brands', href: '/brands' },
      { name: 'New Arrivals', href: '/products/new-arrivals' }
    ],
    account: [
      { name: 'Your Account', href: '/account' },
      { name: 'Order History', href: '/account/orders' },
      { name: 'Wishlist', href: '/account/wishlist' },
      { name: 'Settings', href: '/account/settings' }
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' }
    ]
  };

  const socialLinks = [
    { 
      name: 'Facebook',
      href: 'https://facebook.com/shopfusion',
      icon: FaFacebookF
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/shopfusion',
      icon: FaTwitter
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/shopfusion',
      icon: FaInstagram
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/shopfusion',
      icon: FaLinkedinIn
    }
  ];

  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-5 xl:gap-8">
          {/* Brand section */}
          <div className="xl:col-span-2">
            <Link to="/" className="text-2xl font-bold text-primary">
              ShopFusion
            </Link>
            <p className="mt-4 text-base text-gray-500 max-w-xs">
              Your one-stop destination for high-quality fashion and lifestyle products.
            </p>
            <div className="mt-6 flex space-x-6">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation sections */}
          <div className="mt-12 xl:mt-0 xl:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                Shop
              </h3>
              <ul className="mt-4 space-y-4">
                {navigation.shop.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-base text-gray-500 hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                Account
              </h3>
              <ul className="mt-4 space-y-4">
                {navigation.account.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-base text-gray-500 hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                Company
              </h3>
              <ul className="mt-4 space-y-4">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-base text-gray-500 hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="max-w-md mx-auto xl:max-w-none">
            <form onSubmit={handleNewsletterSubmit} className="sm:flex">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md sm:max-w-xs focus:ring-primary focus:border-primary"
              />
              <button
                type="submit"
                className="mt-3 sm:mt-0 sm:ml-3 w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-sm text-gray-500">
              Subscribe to our newsletter for exclusive offers and updates.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-base text-gray-400 text-center">
            © {currentYear} ShopFusion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;