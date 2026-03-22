import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Target {
  id: string;
  title: string;
  target_type: string;
  target_date: string;
  user_id: string;
}

const CleanupExpiredTargets: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [expiredTargets, setExpiredTargets] = useState<Target[]>([]);
  const [allTargets, setAllTargets] = useState<Target[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Function to check if a target has expired
  const isTargetExpired = (targetType: string, targetDate: string): boolean => {
    const today = new Date();
    const target = new Date(targetDate);
    
    // Set both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    switch (targetType) {
      case 'week':
      case 'month':
      case 'year':
        return today > target;
      default:
        return false; // Don't auto-delete tomorrow targets
    }
  };

  const fetchTargets = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get all week, month, and year targets for the current user
      const { data: targets, error } = await supabase
        .from('targets')
        .select('*')
        .eq('user_id', user.id)
        .in('target_type', ['week', 'month', 'year']);

      if (error) {
        throw error;
      }

      setAllTargets(targets || []);
      
      // Filter expired targets
      const expired = (targets || []).filter(target => 
        isTargetExpired(target.target_type, target.target_date)
      );
      
      setExpiredTargets(expired);
      
      toast({
        title: "Targets Analyzed",
        description: `Found ${expired.length} expired targets out of ${targets?.length || 0} total targets.`,
      });
      
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch targets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupExpiredTargets = async () => {
    if (!user || expiredTargets.length === 0) return;

    try {
      setIsLoading(true);
      
      // Delete expired targets
      const targetIds = expiredTargets.map(target => target.id);
      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('user_id', user.id)
        .in('id', targetIds);

      if (error) {
        throw error;
      }

      toast({
        title: "Cleanup Complete",
        description: `Successfully deleted ${expiredTargets.length} expired targets!`,
      });
      
      // Refresh the targets list
      await fetchTargets();
      
    } catch (error) {
      console.error('Error cleaning up targets:', error);
      toast({
        title: "Error",
        description: "Failed to delete expired targets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Cleanup Expired Targets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fetchTargets} 
            disabled={isLoading || !user}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Scan for Expired Targets
          </Button>
          
          {expiredTargets.length > 0 && (
            <Button 
              onClick={cleanupExpiredTargets} 
              disabled={isLoading}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {expiredTargets.length} Expired Targets
            </Button>
          )}
        </div>

        {allTargets.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">All Week/Month/Year Targets:</h3>
            {allTargets.map(target => (
              <div 
                key={target.id} 
                className={`p-2 rounded border ${
                  isTargetExpired(target.target_type, target.target_date) 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{target.title}</span>
                  <div className="text-sm text-gray-600">
                    <span className="capitalize">{target.target_type}</span> - {target.target_date}
                    {isTargetExpired(target.target_type, target.target_date) && (
                      <span className="ml-2 text-red-600 font-semibold">EXPIRED</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {expiredTargets.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-semibold text-red-800 mb-2">
              Expired Targets ({expiredTargets.length}):
            </h3>
            <ul className="space-y-1">
              {expiredTargets.map(target => (
                <li key={target.id} className="text-red-700">
                  • {target.title} ({target.target_type}, due: {target.target_date})
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CleanupExpiredTargets;
