// src/core/BaseComponent.jsx
/*
================================================================================
File Name : BaseComponent.jsx
Author : Tahseen Raza
Created Date : 2026-06-10
Description : Parent class for all components providing common functionality,
              lifecycle methods, and state management
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

import { Component } from 'react'

class BaseComponent extends Component {
  constructor(props = {}) {
    super(props)
    this.componentName = this.constructor.name
    this.singletonKey = props.singletonKey || this.componentName
  }

  // Common logging method
  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    if (type === 'error') {
      console.error(`[${timestamp}] [${this.componentName}] ${message}`)
    } else if (type === 'warn') {
      console.warn(`[${timestamp}] [${this.componentName}] ${message}`)
    } else {
      console.log(`[${timestamp}] [${this.componentName}] ${message}`)
    }
  }

  // Common error handler
  handleError(error, context = '') {
    this.log(`Error in ${context}: ${error.message}`, 'error')
    return { error: true, message: error.message, context }
  }

  // Common loading state
  setLoading(loading) {
    if (this.setState) {
      this.setState({ loading })
    }
  }

  // Component lifecycle logging
  componentDidMount() {
    this.log('Component mounted')
  }

  componentWillUnmount() {
    this.log('Component unmounting')
  }

  // Render fallback
  render() {
    return null
  }
}

export default BaseComponent