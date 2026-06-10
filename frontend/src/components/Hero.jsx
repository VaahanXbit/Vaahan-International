// import { Link } from 'react-router-dom'
// import { motion } from 'framer-motion'
// import { useEffect, useRef } from 'react'
// import lottie from 'lottie-web'
// // import carHero from "../assets/hero.png";

// const Hero = () => {
//     const lottieBackground = useRef(null)

//     useEffect(() => {
//         if (lottieBackground.current) {
//             const animation = lottie.loadAnimation({
//                 container: lottieBackground.current,
//                 renderer: 'svg',
//                 loop: true,
//                 autoplay: true,
//                 path: '/car-animation.json', // Your Lottie JSON file in public folder
//                 rendererSettings: {
//                     preserveAspectRatio: 'xMidYMid slice',
//                     clearCanvas: true,
//                     progressiveLoad: true,
//                     hideOnTransparent: true
//                 }
//             })

//             return () => {
//                 animation.destroy()
//             }
//         }
//     }, [])

//     return (
//         <section className="relative min-h-[85vh] flex items-center overflow-hidden">
//             {/* Lottie Animation Background - Full Visible */}
//             <div 
//                 ref={lottieBackground}
//                 className="absolute inset-0 w-full h-full z-0"
//                 style={{
//                     pointerEvents: 'none'
//                 }}
//             />
            
//             {/* Dark Overlay to make text readable (optional - remove if not needed) */}
//             <div className="absolute inset-0 bg-black/30 z-0"></div>

//             {/* Content with Glassmorphism Effect */}
//             <div className="container-custom relative z-10 py-20">
//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
//                     {/* Left Content - Glassmorphism Card */}
//                     {/* <motion.div
//                         initial={{ opacity: 0, x: -50 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ duration: 0.6, ease: 'easeOut' }}
//                         className="backdrop-blur-md bg-white/20 rounded-2xl p-8 border border-white/30 shadow-2xl"
//                     >
//                         <motion.div
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: 0.2, duration: 0.5 }}
//                             className="inline-block px-4 py-1.5 bg-white/30 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-6"
//                         >
//                             🚗 Trusted by 10,000+ Indian Car Buyers
//                         </motion.div>
//                         <motion.h1
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: 0.3, duration: 0.5 }}
//                             className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white"
//                         >
//                             Modern Car Features{' '}
//                             <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Explained Simply</span>
//                         </motion.h1>
//                         <motion.p
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: 0.4, duration: 0.5 }}
//                             className="text-xl text-white/90 mb-4"
//                         >
//                             Helping Indian car buyers understand automotive technology before making a purchase decision.
//                         </motion.p>
//                         <motion.p
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: 0.5, duration: 0.5 }}
//                             className="text-white/80 mb-8"
//                         >
//                             From safety features like ABS and Airbags to advanced technologies such as ADAS, Connected Cars, and Electric Vehicles, Vaahan International simplifies complex automotive concepts into easy-to-understand guides.
//                         </motion.p>
//                         <motion.div
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             transition={{ delay: 0.6, duration: 0.5 }}
//                             className="flex flex-wrap gap-4"
//                         >
//                             <Link to="/category" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
//                                 Explore Features →
//                             </Link>
//                             <Link to="/about" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-white/30">
//                                 Learn More
//                             </Link>
//                         </motion.div>
//                     </motion.div> */}

//                     {/* Right Content - Glassmorphism Card with 3D Tutorial */}
//                     <motion.div
//                         initial={{ opacity: 0, scale: 0.9, x: 50 }}
//                         animate={{ opacity: 1, scale: 1, x: 0 }}
//                         transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
//                         className="relative"
//                     >
//                         {/* <div className="backdrop-blur-md bg-white/20 rounded-2xl p-6 border border-white/30 shadow-2xl"> */}
//                             {/* <div className="relative rounded-xl overflow-hidden">
//                                 <img
//                                     src={carHero}
//                                     alt="Modern Car Technology"
//                                     className="w-full h-auto object-cover rounded-xl"
//                                     loading="eager"
//                                 />
//                                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl"></div>
//                             </div>
//                              */}
//                             {/* Interactive 3D Car Tutorial Button */}
//                             {/* <div className="mt-6 text-center">
//                                 <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
//                                     <span className="text-2xl">🎮</span>
//                                     <span className="text-white font-semibold">INTERACTIVE 3D CAR TUTORIAL</span>
//                                     <button className="ml-2 w-10 h-10 rounded-full bg-white/30 flex items-center justify-center hover:bg-white/50 transition-all">
//                                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
//                                             <path d="M8 5v14l11-7z"/>
//                                         </svg>
//                                     </button>
//                                 </div>
//                             </div>
//                         </div> */}
                        
//                         {/* Floating Badges with Glassmorphism */}
//                         <motion.div
//                             animate={{ y: [0, -10, 0] }}
//                             transition={{ duration: 3, repeat: Infinity }}
//                             className="absolute -top-6 -left-6 backdrop-blur-md bg-white/30 rounded-lg shadow-lg px-4 py-2 border border-white/40"
//                         >
//                             <span className="text-yellow-400 font-bold text-xl">100+</span>
//                             <span className="text-white text-sm ml-1">Features</span>
//                         </motion.div>
//                         <motion.div
//                             animate={{ y: [0, 10, 0] }}
//                             transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
//                             className="absolute -bottom-4 -right-6 backdrop-blur-md bg-white/30 rounded-lg shadow-lg px-4 py-2 border border-white/40"
//                         >
//                             <span className="text-yellow-400 font-bold text-xl">10K+</span>
//                             <span className="text-white text-sm ml-1">Readers</span>
//                         </motion.div>
//                     </motion.div>
//                 </div>
//             </div>
//         </section>
//     )
// }

// export default Hero



import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Hero = () => {
    return (
        <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-20 mt-0">
            {/* Background Video - Full Width Infinite Loop */}
            <div className="absolute inset-0 w-full h-full z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        minWidth: '100%',
                        minHeight: '100%',
                    }}
                >
                    <source src="/car_Video1.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
            
            {/* Dark Overlay to make text readable */}
            <div className="absolute inset-0 bg-black/50 z-0"></div>

            {/* Content - Left Aligned */}
            <div className="container-custom relative z-10 py-20">
                <div className="max-w-2xl">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        {/* Trust Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-block px-4 py-1.5 bg-yellow-500 rounded-full text-gray-900 text-sm font-semibold mb-6"
                        >
                            🚗 Trusted by 10,000+ Indian Car Buyers
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white"
                        >
                            Modern Car Features{' '}
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Explained Simply</span>
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-xl text-gray-200 mb-4"
                        >
                            Helping Indian car buyers understand automotive technology before making a purchase decision.
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-gray-300 mb-8"
                        >
                            From safety features like ABS and Airbags to advanced technologies such as ADAS, Connected Cars, and Electric Vehicles, Vaahan International simplifies complex automotive concepts into easy-to-understand guides.
                        </motion.p>

                        {/* Buttons - Left Aligned */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="flex flex-wrap gap-4"
                        >
                            <Link 
                                to="/category" 
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Explore Features →
                            </Link>
                            <Link 
                                to="/about" 
                                className="bg-white text-gray-800 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-gray-200"
                            >
                                Learn More
                            </Link>
                        </motion.div>

                        {/* Stats Section - Left Aligned */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/20"
                        >
                            <div>
                                <div className="text-3xl font-bold text-yellow-400">100+</div>
                                <div className="text-gray-300 text-sm">Features</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-yellow-400">10K+</div>
                                <div className="text-gray-300 text-sm">Readers</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default Hero