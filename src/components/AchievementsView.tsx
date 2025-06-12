import React, { useState } from 'react';
import { Plus, Trophy, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAchievements } from '@/hooks/useAchievements';
import { useIsMobile } from '@/hooks/use-mobile';
import AddAchievementModal from './AddAchievementModal';
import EditAchievementModal from './EditAchievementModal';
import { Achievement } from '@/hooks/useAchievements';

interface AchievementsViewProps {
  onBack?: () => void;
}

const AchievementsView = ({ onBack }: AchievementsViewProps = {}) => {
  const { achievements, loading, deleteAchievement, refetch } = useAchievements();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const isMobile = useIsMobile();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Default back behavior - go to previous page in history
      window.history.back();
    }
  };

  // Optimize grid columns based on screen width for mobile
  const getGridCols = () => {
    if (!isMobile) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

    // For mobile, use CSS classes that handle different screen sizes
    return 'achievement-grid-mobile';
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      const success = await deleteAchievement(id);
      if (success) {
        refetch();
      }
    }
  };

  const handleAchievementCreated = () => {
    refetch();
    setShowAddModal(false);
  };

  const handleAchievementUpdated = () => {
    refetch();
    setEditingAchievement(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5f5f5' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: '#e5e7eb'
      }}
    >
      {/* Brick wall overlay */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='60' viewBox='0 0 120 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.3'%3E%3Crect x='0' y='0' width='60' height='30'/%3E%3Crect x='60' y='30' width='60' height='30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content */}
      <div className={`relative z-10 ${isMobile ? 'p-3 achievement-container' : 'p-6'}`}>
        {/* Header */}
        <div className={`${isMobile ? 'flex flex-col space-y-4 mb-6' : 'flex items-center justify-between mb-8'}`}>
          <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
            {/* Back Button */}
            <Button
              onClick={handleBack}
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              className={`${isMobile ? 'p-2' : 'p-3'} hover:bg-slate-200/50 text-slate-700 hover:text-slate-900`}
              aria-label="Go back"
            >
              <ArrowLeft className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </Button>

            <div className={`${isMobile ? 'p-2' : 'p-3'} bg-yellow-500/20 rounded-xl`}>
              <Trophy className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-yellow-400`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-slate-800`}>Achievements Wall</h1>
              <p className={`text-slate-600 ${isMobile ? 'text-sm' : ''}`}>Celebrate your milestones and victories</p>
            </div>
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
            size={isMobile ? "default" : "lg"}
          >
            <Plus className={`${isMobile ? 'w-4 h-4 mr-1' : 'w-5 h-5 mr-2'}`} />
            {isMobile ? 'Add' : 'Add Achievement'}
          </Button>
        </div>

        {/* Achievements Grid */}
        <div className={`grid achievements-grid ${getGridCols()} ${isMobile ? 'gap-3' : 'gap-6'}`}>
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`group relative bg-white/90 backdrop-blur-sm border-2 border-amber-200 shadow-xl hover:shadow-2xl transition-all duration-300 achievement-card ${isMobile ? 'achievement-card-small' : 'hover:scale-105'}`}
              style={{
                aspectRatio: '9/16',
                background: 'linear-gradient(145deg, #fefefe, #f0f0f0)',
                boxShadow: isMobile ? '4px 4px 8px #d1d1d1, -4px -4px 8px #ffffff' : '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff'
              }}
            >
              <CardContent className="p-0 h-full relative">
                {/* Frame border effect */}
                <div className={`absolute ${isMobile ? 'inset-1 border-2' : 'inset-2 border-4'} border-amber-600/30 rounded-lg pointer-events-none z-10`} />
                <div className={`absolute ${isMobile ? 'inset-0.5 border' : 'inset-1 border-2'} border-amber-800/20 rounded-lg pointer-events-none z-10`} />

                {/* Action buttons */}
                <div className={`absolute ${isMobile ? 'top-1 right-1' : 'top-3 right-3'} ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 z-30 flex ${isMobile ? 'flex-col space-y-1 mobile-button-group' : 'space-x-1'}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    className={`${isMobile ? 'h-8 w-8' : 'h-8 w-8'} p-0 bg-slate-800/90 hover:bg-slate-900 border border-slate-600 shadow-lg ${isMobile ? 'touch-manipulation' : ''}`}
                    onClick={() => setEditingAchievement(achievement)}
                    aria-label="Edit achievement"
                  >
                    <Edit className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-white`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className={`${isMobile ? 'h-8 w-8' : 'h-8 w-8'} p-0 bg-red-500/90 hover:bg-red-600 border border-red-400 shadow-lg ${isMobile ? 'touch-manipulation' : ''}`}
                    onClick={() => handleDelete(achievement.id)}
                    aria-label="Delete achievement"
                  >
                    <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'} text-white`} />
                  </Button>
                </div>

                {/* Image - Full height */}
                <div className={`absolute ${isMobile ? 'inset-2' : 'inset-4'} rounded-lg overflow-hidden`}>
                  {achievement.image_url ? (
                    <img
                      src={achievement.image_url}
                      alt={achievement.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Trophy className={`${isMobile ? 'w-8 h-8' : 'w-16 h-16'} text-amber-600/50`} />
                    </div>
                  )}
                </div>

                {/* Text content overlay */}
                <div className={`absolute ${isMobile ? 'bottom-2 left-2 right-2' : 'bottom-4 left-4 right-4'} z-20`}>
                  <div className={`bg-white/90 backdrop-blur-sm rounded-lg ${isMobile ? 'p-2 space-y-1' : 'p-3 space-y-2'} shadow-lg`}>
                    <h3 className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'} text-slate-800 line-clamp-2 leading-tight achievement-text`}>
                      {achievement.title}
                    </h3>
                    {achievement.achievement_date && (
                      <Badge variant="secondary" className={`bg-amber-100 text-amber-800 ${isMobile ? 'text-xs px-1 py-0' : 'text-xs'}`}>
                        {formatDate(achievement.achievement_date)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new achievement card */}
          <Card
            className={`group cursor-pointer bg-white/50 backdrop-blur-sm border-2 border-dashed border-amber-300 hover:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 ${isMobile ? '' : 'hover:scale-105'}`}
            style={{ aspectRatio: '9/16' }}
            onClick={() => setShowAddModal(true)}
          >
            <CardContent className={`h-full flex flex-col items-center justify-center ${isMobile ? 'p-3' : 'p-6'} text-center`}>
              <div className={`${isMobile ? 'p-2' : 'p-4'} bg-amber-100 rounded-full ${isMobile ? 'mb-2' : 'mb-4'} group-hover:bg-amber-200 transition-colors`}>
                <Plus className={`${isMobile ? 'w-4 h-4' : 'w-8 h-8'} text-amber-600`} />
              </div>
              <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-lg'} text-slate-700 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                {isMobile ? 'Add New' : 'Add New Achievement'}
              </h3>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500`}>
                {isMobile ? 'Tap to create' : 'Click to create a new achievement frame'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Empty state */}
        {achievements.length === 0 && (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-16'}`}>
            <div className={`${isMobile ? 'p-4' : 'p-6'} bg-white/80 rounded-xl shadow-lg ${isMobile ? 'max-w-sm' : 'max-w-md'} mx-auto`}>
              <Trophy className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-amber-500 mx-auto ${isMobile ? 'mb-3' : 'mb-4'}`} />
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-slate-800 mb-2`}>No Achievements Yet</h3>
              <p className={`text-slate-600 ${isMobile ? 'text-sm mb-3' : 'mb-4'}`}>
                {isMobile ? 'Start building your achievement wall!' : 'Start building your achievement wall by adding your first milestone!'}
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                size={isMobile ? "sm" : "default"}
              >
                <Plus className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
                {isMobile ? 'Add First' : 'Add Your First Achievement'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddAchievementModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAchievementCreated={handleAchievementCreated}
      />

      {editingAchievement && (
        <EditAchievementModal
          achievement={editingAchievement}
          open={!!editingAchievement}
          onOpenChange={(open) => !open && setEditingAchievement(null)}
          onAchievementUpdated={handleAchievementUpdated}
        />
      )}
    </div>
  );
};

export default AchievementsView;
