// src/pages/Contact.jsx
/*
================================================================================
File Name : Contact.jsx
Author : Tahseen Raza
Created Date : 2026-06-10
Description : Contact page component - displays contact form and company contact
              information for user inquiries
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import { motion } from 'framer-motion'
import BasePage from './BasePage'

class ContactPage extends BasePage {
  constructor(props) {
    super(props)
    this.pageTitle = 'Contact Vaahan International | Get in Touch'
    this.pageDescription = 'Have questions about automotive technology or suggestions for future guides? Contact us today.'
    this.state = {
      formData: { fullName: '', email: '', phone: '', subject: '', message: '' },
      submitted: false
    }
  }

  handleChange = (e) => {
    this.setState({ formData: { ...this.state.formData, [e.target.name]: e.target.value } })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    console.log('Contact form submitted:', this.state.formData)
    this.setState({ submitted: true, formData: { fullName: '', email: '', phone: '', subject: '', message: '' } })
    setTimeout(() => this.setState({ submitted: false }), 5000)
  }

  fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  }

  renderContent() {
    const { formData, submitted } = this.state
    const contactInfo = [
      { icon: '✉️', title: 'Email', value: 'contact@vaahan-international.com', link: 'mailto:contact@vaahan-international.com' },
      { icon: '📞', title: 'Phone', value: '+91 98765 43210', link: 'tel:+919876543210' },
      { icon: '📍', title: 'Location', value: 'New Delhi, India', link: null }
    ]

    return (
      <>
        <section className="relative pt-32 pb-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container-custom text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-xl text-gray-300 max-w-2xl mx-auto">Have questions about automotive technology or suggestions for future guides? We'd love to hear from you.</motion.p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container-custom"><div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div variants={this.fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}><h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h3>
              <form onSubmit={this.handleSubmit} className="space-y-5">
                <div><label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={this.handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="John Doe" /></div>
                <div><label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label><input type="email" id="email" name="email" value={formData.email} onChange={this.handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="john@example.com" /></div>
                <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={this.handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="+91 98765 43210" /></div>
                <div><label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject *</label><input type="text" id="subject" name="subject" value={formData.subject} onChange={this.handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="How can we help you?" /></div>
                <div><label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label><textarea id="message" name="message" value={formData.message} onChange={this.handleChange} required rows="5" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" placeholder="Tell us about your question or suggestion..."></textarea></div>
                <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">Send Message</button>
                {submitted && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-100 text-green-700 rounded-lg text-center">Thank you for reaching out! We'll respond within 24-48 hours.</motion.div>)}
              </form>
            </motion.div>

            <motion.div variants={this.fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}><h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-6">{contactInfo.map((info, idx) => (<div key={idx} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl"><div className="text-2xl">{info.icon}</div><div><h4 className="font-semibold text-gray-900">{info.title}</h4>{info.link ? (<a href={info.link} className="text-gray-600 hover:text-yellow-500 transition-colors">{info.value}</a>) : (<p className="text-gray-600">{info.value}</p>)}</div></div>))}</div>
              <div className="mt-8 p-4 bg-yellow-50 rounded-xl"><div className="flex items-center space-x-3"><span className="text-2xl">⏰</span><div><h4 className="font-semibold text-gray-900">Response Time</h4><p className="text-gray-600 text-sm">Within 24–48 hours</p></div></div></div>
              <div className="mt-8"><div className="bg-gray-200 rounded-xl h-64 flex items-center justify-center"><span className="text-gray-500">📍 Location Map - New Delhi, India</span></div></div>
            </motion.div>
          </div></div>
        </section>
      </>
    )
  }
}

let contactPageInstance = null
export const getContactPage = () => {
  if (!contactPageInstance) {
    contactPageInstance = new ContactPage({})
  }
  return contactPageInstance
}

const Contact = () => {
  const page = getContactPage()
  return page.render()
}

export default Contact