import React from 'react';

interface AuthDividerProps {
  text?: string;
}

const AuthDivider: React.FC<AuthDividerProps> = ({ text = "or" }) => {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/50" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-4 text-muted-foreground font-medium tracking-wider">
          {text}
        </span>
      </div>
    </div>
  );
};

export default AuthDivider;
