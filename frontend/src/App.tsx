import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="page-container">
        <div className="content-container">
          <h1 className="text-3xl font-bold text-center text-saffron-600 mb-8">
            Welcome to LCC Assemble
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Community event management platform coming soon...
          </p>
          <div className="text-center">
            <div className="inline-block w-16 h-16 bg-saffron-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App