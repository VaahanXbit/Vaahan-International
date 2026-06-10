import { useState } from 'react'
import { motion } from 'framer-motion'
import { featuresData, getAllFeatures } from '../data/featuresData'

const Category = () => {
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedFeature, setSelectedFeature] = useState(null)

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  }

  const categories = [
    { id: 'all', name: 'All Features', icon: '📋', count: getAllFeatures().length },
    ...Object.values(featuresData).map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      count: cat.features.length
    }))
  ]

  const getFilteredFeatures = () => {
    if (activeCategory === 'all') {
      return getAllFeatures()
    }
    return featuresData[activeCategory]?.features.map(f => ({
      ...f,
      categoryId: activeCategory,
      categoryName: featuresData[activeCategory].name,
      categoryColor: featuresData[activeCategory].color
    })) || []
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container-custom text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Automotive Technology Library
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Comprehensive guides to every modern car feature - explained in simple language
          </motion.p>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="sticky top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom">
          <div className="flex overflow-x-auto hide-scrollbar py-4 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id)
                  setSelectedFeature(null)
                }}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === category.id ? 'bg-white/20' : 'bg-gray-300'
                }`}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Features List */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {getFilteredFeatures().map((feature, idx) => (
                  <motion.div
                    key={feature.id}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: (idx % 10) * 0.05 }}
                    onClick={() => setSelectedFeature(feature)}
                    className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer ${
                      selectedFeature?.id === feature.id ? 'ring-2 ring-orange-500' : ''
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3">
                      <div className="h-48 md:h-full overflow-hidden">
                        <img 
                          src={feature.image} 
                          alt={feature.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="col-span-2 p-6">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            feature.isStandard ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {feature.isStandard ? '✓ Standard Feature' : '★ Advanced Feature'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.name}</h3>
                        <p className="text-gray-600 mb-2">{feature.shortDesc}</p>
                        <p className="text-gray-500 text-sm mb-3">{feature.tagline}</p>
                        <div className="flex items-center text-orange-500 font-semibold text-sm">
                          Learn Why This Matters →
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Feature Detail Sidebar */}
            <div className="lg:col-span-1">
              {selectedFeature ? (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="sticky top-36 bg-white rounded-xl shadow-lg overflow-hidden max-h-[85vh] overflow-y-auto"
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={selectedFeature.image} 
                      alt={selectedFeature.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedFeature.name}</h3>
                      <p className="text-orange-500 text-sm font-medium">{selectedFeature.tagline}</p>
                    </div>

                    {/* Simple Explanation */}
                    <div className="mb-5 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span>💡</span> Simple Explanation
                      </h4>
                      <p className="text-gray-700 text-sm mb-2"><strong>What it is:</strong> {selectedFeature.simpleExplanation?.what}</p>
                      <p className="text-gray-700 text-sm mb-2"><strong>Think of it like:</strong> {selectedFeature.simpleExplanation?.analogy}</p>
                      <p className="text-gray-700 text-sm"><strong>When it works:</strong> {selectedFeature.simpleExplanation?.whenUsed}</p>
                    </div>

                    {/* How It Works */}
                    <div className="mb-5">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span>⚙️</span> How It Works
                      </h4>
                      <div className="space-y-2">
                        {selectedFeature.howItWorks && Object.values(selectedFeature.howItWorks).map((step, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mb-5 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span>✅</span> Benefits
                      </h4>
                      <ul className="space-y-1">
                        {selectedFeature.benefits?.map((benefit, i) => (
                          <li key={i} className="text-sm text-gray-700">{benefit}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons / Limitations */}
                    <div className="mb-5 p-4 bg-red-50 rounded-lg">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span>⚠️</span> Things to Know
                      </h4>
                      <ul className="space-y-1">
                        {selectedFeature.cons?.map((con, i) => (
                          <li key={i} className="text-sm text-gray-700">{con}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Who Needs It Most */}
                    <div className="mb-5">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span>🎯</span> Who Needs This Most?
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeature.bestFor?.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Technical Specs */}
                    <div className="mb-5 p-4 bg-gray-50 rounded-lg text-sm">
                      <h4 className="font-bold text-gray-900 mb-2">📊 Technical Details</h4>
                      {selectedFeature.technical && Object.entries(selectedFeature.technical).map(([key, value]) => (
                        <p key={key} className="text-gray-600 mb-1"><strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}</p>
                      ))}
                      <p className="text-gray-600 mt-2"><strong>Applicable Vehicles:</strong> {selectedFeature.applicableVehicles}</p>
                      {selectedFeature.priceRange && (
                        <p className="text-gray-600"><strong>Price Range:</strong> {selectedFeature.priceRange}</p>
                      )}
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-300">
                      Save to My Guide
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="sticky top-36 bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">📚</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Select a Feature</h4>
                  <p className="text-gray-500 text-sm">
                    Click on any feature card to view detailed information about how it works, benefits, and things to know.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-orange-500">
        <div className="container-custom text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Can't Find What You're Looking For?</h2>
            <p className="text-lg text-orange-100 mb-6">Contact us and suggest a topic you'd like us to cover</p>
            <a href="/contact" className="inline-block bg-white text-orange-500 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-300">
              Suggest a Topic
            </a>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}

export default Category