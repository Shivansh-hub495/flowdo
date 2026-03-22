import React from 'react';
import { Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 opacity-90"></div>
        <div className="flex flex-col justify-between h-full p-8 text-white relative">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="FlowDo Logo" className="h-8 w-8" />
            <span className="text-2xl font-bold">FlowDo</span>
          </div>
          <div className="mb-12">
            <h2 className="text-4xl font-bold leading-tight">The secret of getting ahead is getting started.</h2>
            <p className="text-muted-foreground mt-4 text-lg">- Mark Twain</p>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-lg italic">"FlowDo has completely transformed my workflow. I can't imagine my day without it!"</p>
            <p className="text-right text-sm mt-2 text-gray-400">- A Happy User</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-balance text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
