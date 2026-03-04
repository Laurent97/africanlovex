import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PublicFooter = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">LoveX</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connecting hearts across East Africa with authentic relationships and cultural understanding.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Features</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">VIP Membership</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Gift Store</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Live Streaming</Button></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">About Us</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Success Stories</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Blog</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Careers</Button></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Help Center</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Safety Tips</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Contact Us</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">Privacy Policy</Button></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 LoveX. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm">
              Terms of Service
            </Button>
            <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm">
              Privacy Policy
            </Button>
            <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm">
              Cookie Policy
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};
