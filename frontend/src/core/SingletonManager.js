// src/core/SingletonManager.js
/*
================================================================================
File Name : SingletonManager.js
Author : Tahseen Raza
Created Date : 2026-06-10
Description : Manages singleton instances across the application to ensure only 
              one instance of each component/page is created
Company : Vaahan International
Copyright : (c) 2026 Vaahan International. All rights reserved.
================================================================================
*/

class SingletonManager {
  constructor() {
    if (SingletonManager.instance) {
      return SingletonManager.instance
    }
    this.instances = new Map()
    SingletonManager.instance = this
  }

  getInstance(key, createInstance, ...args) {
    if (!this.instances.has(key)) {
      this.instances.set(key, createInstance(...args))
    }
    return this.instances.get(key)
  }

  clearInstance(key) {
    if (this.instances.has(key)) {
      this.instances.delete(key)
    }
  }

  clearAllInstances() {
    this.instances.clear()
  }
}

const singletonManager = new SingletonManager()
Object.freeze(singletonManager)

export default singletonManager