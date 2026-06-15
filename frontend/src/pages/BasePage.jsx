// src/pages/BasePage.jsx
/*
================================================================================
File Name : BasePage.jsx
Author : Tahseen Raza
Created Date : 2026-06-10
Description : Parent class for all page components providing common page 
              functionality, SEO metadata, and page lifecycle methods
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import BaseComponent from '../core/BaseComponent'
import CommonHeader from '../components/CommonHeader'
import CommonFooter from '../components/CommonFooter'

class BasePage extends BaseComponent {
  constructor(props) {
    super(props)
    this.pageTitle = props.pageTitle || 'Vaahan International'
    this.pageDescription = props.pageDescription || 'Modern Car Features Explained Simply'
  }

  // Set page metadata
  setPageMetadata() {
    document.title = this.pageTitle
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', this.pageDescription)
    }
  }

  // Scroll to top on page change
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  componentDidMount() {
    super.componentDidMount()
    this.setPageMetadata()
    this.scrollToTop()
  }

  render() {
    return (
      <div className="flex flex-col min-h-screen">
        <CommonHeader />
        <main className="flex-grow pt-20">
          {this.renderContent()}
        </main>
        <CommonFooter />
      </div>
    )
  }

  // To be overridden by child classes
  renderContent() {
    return null
  }
}

export default BasePage