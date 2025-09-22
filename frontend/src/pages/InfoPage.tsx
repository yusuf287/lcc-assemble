import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const InfoPage: React.FC = () => {
  const handleEmailClick = () => {
    window.open('mailto:lakeshoreculturalcommittee@gmail.com', '_blank')
  }

  const handlePhoneClick = () => {
    window.open('tel:+16479735359', '_blank')
  }

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/16479735359', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Lakeshore Cultural Committee
            </h1>
            <p className="text-xl md:text-2xl mb-2 opacity-90">
              LCC - Building Community Together
            </p>
            <p className="text-lg opacity-80 italic">
              "Creating bonds that go beyond borders, celebrating diversity in unity."
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* About Section */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About LCC</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
          </div>

          <div className="prose prose-lg max-w-none text-center">
            <p className="text-gray-700 leading-relaxed mb-6">
              The Lakeshore Cultural Committee (LCC) is a close-knit group of friends and families, primarily residing in the Bathurst–Lakeshore area of Toronto. For the past five years, LCC has been a vibrant platform to celebrate festivals, traditions, and togetherness far away from our roots.
            </p>

            <p className="text-gray-700 leading-relaxed mb-6">
              From colorful festivities like Holi, Ganesh Utsav, and Navratri, to joyful occasions such as Christmas and New Year, and even spirited sports tournaments, LCC brings people together to create lasting memories. We organize potluck dinners, farewell parties, housewarming celebrations, and much more – fostering a sense of belonging and community spirit in our diverse neighborhood.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Whether you're new to the area or have been part of the community for years, LCC welcomes everyone to join our events, share experiences, and build meaningful connections. Our committee is dedicated to preserving cultural traditions while embracing the multicultural fabric of Toronto.
            </p>
          </div>

          <div className="text-center mt-8">
            <p className="text-lg font-semibold text-orange-600 italic">
              Join us in celebrating life, culture, and community!
            </p>
          </div>
        </Card>

        {/* What We Do Section */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do</h2>
            <div className="w-24 h-1 bg-green-500 mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <div className="text-4xl mb-4">🪔</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cultural Festivals</h3>
              <p className="text-gray-600">Holi, Ganesh Utsav, Navratri, and more</p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl mb-4">🎄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Holiday Celebrations</h3>
              <p className="text-gray-600">Christmas, New Year, and seasonal events</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sports Tournaments</h3>
              <p className="text-gray-600">Volleyball, basketball, and friendly competitions</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-4xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Community Gatherings</h3>
              <p className="text-gray-600">Potlucks, farewell parties, and social meetups</p>
            </div>

            <div className="text-center p-6 bg-pink-50 rounded-lg">
              <div className="text-4xl mb-4">🎂</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Birthday Celebrations</h3>
              <p className="text-gray-600">Special birthday parties and celebrations</p>
            </div>

            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-4xl mb-4">🏡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Housewarming Events</h3>
              <p className="text-gray-600">Welcoming new homes and families</p>
            </div>
          </div>
        </Card>

        {/* Get In Touch Section */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <div className="w-24 h-1 bg-blue-500 mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">✉️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email</h3>
              <Button
                onClick={handleEmailClick}
                variant="outline"
                className="mb-2"
              >
                lakeshoreculturalcommittee@gmail.com
              </Button>
              <p className="text-sm text-gray-600">For general inquiries and information</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone</h3>
              <Button
                onClick={handlePhoneClick}
                variant="outline"
                className="mb-2"
              >
                +1 647 973 5359
              </Button>
              <p className="text-sm text-gray-600">For urgent communications</p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">WhatsApp</h3>
              <Button
                onClick={handleWhatsAppClick}
                variant="outline"
                className="mb-2"
              >
                Message Us
              </Button>
              <p className="text-sm text-gray-600">Quick messaging for event coordination</p>
            </div>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Location</h3>
            <p className="text-gray-700">Bathurst–Lakeshore area, Toronto</p>
            <p className="text-sm text-gray-600 mt-2">Serving the multicultural community of Toronto's west end</p>
          </div>
        </Card>

        {/* Call to Action */}
        <Card className="p-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Join Us?</h2>
            <p className="text-xl mb-6 opacity-90">
              Complete your profile and become part of our vibrant community. Start attending events, organizing activities, and building lasting friendships!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                  Join the Community
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 text-lg font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="text-sm mt-6 opacity-80">
              Already have an account? <Link to="/login" className="underline hover:no-underline">Sign in here</Link>
            </p>
          </div>
        </Card>

        {/* Community Stats */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Community</h2>
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">5+</div>
              <div className="text-gray-600">Years of Community</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">100+</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Events Organized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">∞</div>
              <div className="text-gray-600">Memories Created</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default InfoPage