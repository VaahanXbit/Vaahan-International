// src/components/CommonHeader.jsx
/*
================================================================================
File Name : CommonHeader.jsx
Author : Tahseen Raza
Created Date : 2026-06-10
Description : Reusable header component with singleton pattern - only one 
              instance exists across the entire application
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import BaseComponent from '../core/BaseComponent'
import singletonManager from '../core/SingletonManager'

class CommonHeader extends BaseComponent {
  constructor(props = {}) {
    super(props)
    this.state = {
      isOpen: false,
      isScrolled: false
    }
    this.brandYellow = '#CFB32B'  // Your exact brand color
    this.navLinks = [
      { path: '/', name: 'Home' },
      { path: '/about', name: 'About' },
      { path: '/category', name: 'Category' },
      { path: '/contact', name: 'Contact' },
    ]
  }

  componentDidMount() {
    super.componentDidMount()
    window.addEventListener('scroll', this.handleScroll)
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    window.removeEventListener('scroll', this.handleScroll)
  }

  handleScroll = () => {
    this.setState({ isScrolled: window.scrollY > 20 })
  }

  toggleMenu = () => {
    this.setState(prev => ({ isOpen: !prev.isOpen }))
  }

  closeMenu = () => {
    this.setState({ isOpen: false })
  }

  render() {
    const { isOpen, isScrolled } = this.state

    return (
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'py-2 shadow-xl' : 'py-3'
        }`}
        style={{
          backgroundColor: this.brandYellow,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center group"
              onClick={this.closeMenu}
            >
              <img
                src="/Vaahan_International_Logo.jpg"
                alt="Vaahan International"
                className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-10">
              {this.navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `font-semibold text-[16px] tracking-wide transition-all duration-300 ${
                      isActive
                        ? 'text-black border-b-2 border-black pb-1'
                        : 'text-gray-900 hover:text-black'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

              <Link
                to="/contact"
                className="
                  bg-[#0B1F3A]
                  hover:bg-[#08172C]
                  text-white
                  font-semibold
                  py-3
                  px-8
                  rounded-xl
                  shadow-lg
                  transition-all
                  duration-300
                  hover:-translate-y-1
                "
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={this.toggleMenu}
              className="md:hidden focus:outline-none"
              aria-label="Toggle Menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span
                  className={`h-0.5 w-full bg-black transition-all duration-300 ${
                    isOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-black transition-all duration-300 ${
                    isOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-black transition-all duration-300 ${
                    isOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isOpen ? 'auto' : 0,
              opacity: isOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden md:hidden"
          >
            <div className="pt-5 pb-6 space-y-4">
              {this.navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `block py-2 font-medium text-lg ${
                      isActive ? 'text-black' : 'text-gray-900 hover:text-black'
                    }`
                  }
                  onClick={this.closeMenu}
                >
                  {link.name}
                </NavLink>
              ))}

              <Link
                to="/contact"
                className="
                  block
                  text-center
                  bg-[#0B1F3A]
                  hover:bg-[#08172C]
                  text-white
                  font-semibold
                  py-3
                  rounded-xl
                  transition-all
                  duration-300
                "
                onClick={this.closeMenu}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </nav>
    )
  }
}

// Create header instance with proper props
let headerInstance = null

export const getHeader = () => {
  if (!headerInstance) {
    headerInstance = singletonManager.getInstance('CommonHeader', () => new CommonHeader({}))
  }
  return headerInstance
}

// Functional component wrapper for React rendering
const CommonHeaderComponent = () => {
  const header = getHeader()
  return header.render()
}

export default CommonHeaderComponent