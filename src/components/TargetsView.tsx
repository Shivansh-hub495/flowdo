import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Target, Trash2, Edit, Crosshair } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTargets, Target as TargetType } from '@/hooks/useTargets';
import AddTargetDialog from '@/components/AddTargetDialog';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';

interface TargetsViewProps {
  onSlideChange?: (slideIndex: number) => void;
}

const TargetsView: React.FC<TargetsViewProps> = ({ onSlideChange }) => {
  const { toast } = useToast();
  const { targets, loading, toggleTargetCompletion, deleteTarget, getTargetsByType, fetchTargets } = useTargets();
  const isMobile = useIsMobile();

  // Carousel state for mobile navigation
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Target type labels for navigation indicators
  const targetTypes = [
    { type: 'tomorrow' as const, label: 'Tomorrow' },
    { type: 'week' as const, label: 'Week' },
    { type: 'month' as const, label: 'Month' },
    { type: 'year' as const, label: 'Year' }
  ];

  const handleTargetCreated = async () => {
    // Force refresh the targets data
    await fetchTargets();
  };

  // Carousel navigation effects
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const slideIndex = carouselApi.selectedScrollSnap();
      setCurrentSlide(slideIndex);
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());

      // Notify parent component about slide change
      if (onSlideChange) {
        onSlideChange(slideIndex);
      }
    };

    carouselApi.on('select', onSelect);
    onSelect(); // Set initial state

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, onSlideChange]);

  // Navigation functions
  const scrollToPrevious = () => {
    carouselApi?.scrollPrev();
  };

  const scrollToNext = () => {
    carouselApi?.scrollNext();
  };

  const scrollToSlide = (index: number) => {
    carouselApi?.scrollTo(index);
  };



  const tomorrowTargets = getTargetsByType('tomorrow');
  const weekTargets = getTargetsByType('week');
  const monthTargets = getTargetsByType('month');
  const yearTargets = getTargetsByType('year');

  const handleToggleTargetComplete = async (targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    if (target) {
      const updatedTarget = await toggleTargetCompletion(targetId);
      if (updatedTarget) {
        toast({
          title: updatedTarget.completed ? "Target completed!" : "Target reopened",
          description: `"${updatedTarget.title}" ${updatedTarget.completed ? 'marked as complete' : 'has been reopened'}`,
        });
      }
    }
  };

  const handleDeleteTarget = async (targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    if (target) {
      const success = await deleteTarget(targetId);
      if (success) {
        toast({
          title: "Target deleted",
          description: `"${target.title}" has been deleted`,
        });
      }
    }
  };

  const getTargetTypeLabel = (type: TargetType['target_type']): string => {
    switch (type) {
      case 'tomorrow':
        return 'Tomorrow';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
    }
  };

  const getTargetTypeColor = (type: TargetType['target_type']): string => {
    switch (type) {
      case 'tomorrow':
        return 'from-blue-500/10 to-cyan-500/10 border-blue-500/30';
      case 'week':
        return 'from-green-500/10 to-emerald-500/10 border-green-500/30';
      case 'month':
        return 'from-orange-500/10 to-amber-500/10 border-orange-500/30';
      case 'year':
        return 'from-purple-500/10 to-violet-500/10 border-purple-500/30';
    }
  };

  const getTargetTypeIcon = (type: TargetType['target_type']) => {
    switch (type) {
      case 'tomorrow':
        return <Calendar className="text-blue-400" size={16} />;
      case 'week':
        return <Clock className="text-green-400" size={16} />;
      case 'month':
        return <Target className="text-orange-400" size={16} />;
      case 'year':
        return <Crosshair className="text-purple-400" size={16} />;
    }
  };

  const renderTargetCard = (target: TargetType) => (
    <div
      key={target.id}
      className={`group relative rounded-xl border transition-all duration-300 ${
        isMobile
          ? 'target-item-mobile'
          : 'p-4 hover:scale-[1.02]'
      } ${
        target.completed
          ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
          : `bg-gradient-to-r ${getTargetTypeColor(target.target_type)} hover:shadow-lg`
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            {getTargetTypeIcon(target.target_type)}
            <h3 className={`font-medium truncate target-title ${
              target.completed ? 'line-through text-slate-500' : 'text-white'
            }`}>
              {target.title}
            </h3>
          </div>
          
          {target.description && (
            <p className={`text-sm mb-3 ${
              target.completed ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {target.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${
                target.completed
                  ? 'border-green-500/30 text-green-400'
                  : 'border-current'
              }`}
            >
              {getTargetTypeLabel(target.target_type)}
            </Badge>

            <div className={`flex items-center space-x-2 target-actions ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
              <Button
                size="sm"
                variant="ghost"
                className={`p-0 ${
                  isMobile ? 'h-7 w-7' : 'h-8 w-8'
                } ${
                  target.completed
                    ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400'
                    : 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400'
                }`}
                onClick={() => handleToggleTargetComplete(target.id)}
              >
                <CheckCircle size={isMobile ? 12 : 14} />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className={`p-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 ${
                  isMobile ? 'h-7 w-7' : 'h-8 w-8'
                }`}
                onClick={() => handleDeleteTarget(target.id)}
              >
                <Trash2 size={isMobile ? 12 : 14} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={`text-xs mt-3 pt-3 border-t ${
        target.completed ? 'border-slate-700 text-slate-600' : 'border-slate-700/50 text-slate-500'
      }`}>
        <div className="flex items-center justify-between">
          <span>Created: {new Date(target.created_at).toLocaleDateString()}</span>
          <span>Target: {new Date(target.target_date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  const renderTargetColumn = (
    type: TargetType['target_type'],
    targets: TargetType[],
    title: string,
    description: string
  ) => (
    <Card className={`relative overflow-hidden bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 h-fit ${
      isMobile ? 'target-card-mobile' : ''
    }`}>
      <CardHeader className={`pb-4 ${isMobile ? 'card-header' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`font-semibold text-white flex items-center ${
            isMobile ? 'text-base' : 'text-lg'
          }`}>
            <div className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-br ${getTargetTypeColor(type)} mr-3 ${
              isMobile ? 'w-6 h-6' : 'w-8 h-8'
            }`}>
              {getTargetTypeIcon(type)}
            </div>
            {title}
          </CardTitle>
          <AddTargetDialog targetType={type} onTargetCreated={handleTargetCreated}>
            <Button
              size="sm"
              variant="outline"
              className={`border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white ${
                isMobile ? 'add-button' : ''
              }`}
            >
              <Target size={isMobile ? 12 : 14} className="mr-1" />
              Add
            </Button>
          </AddTargetDialog>
        </div>
        <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>{description}</p>
      </CardHeader>
      <CardContent className={`pt-0 space-y-3 ${isMobile ? 'card-content' : ''}`}>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2 text-sm">Loading...</p>
          </div>
        ) : targets.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No targets yet</p>
            <p className="text-xs text-muted-foreground">Add a target to get started!</p>
          </div>
        ) : (
          targets.map(renderTargetCard)
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-violet-950/10 ${
      isMobile ? 'targets-mobile-container targets-mobile-safe-area' : 'p-6'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center ${isMobile ? 'targets-header-mobile' : 'mb-8'}`}>
          <div className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 mb-4 ${
            isMobile ? 'icon-container' : 'w-16 h-16'
          }`}>
            <Crosshair className="text-violet-400" size={isMobile ? 24 : 28} />
          </div>
          <h1 className={`font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent ${
            isMobile ? '' : 'text-3xl'
          }`}>
            Future Targets
          </h1>
          <p className={`text-slate-400 ${isMobile ? '' : 'text-lg'}`}>
            Plan and organize your goals across different time horizons
          </p>
        </div>

        {/* Target Columns */}
        {isMobile ? (
          <div className="relative">
            {/* Navigation Indicators */}
            <div className="targets-nav-indicators">
              {targetTypes.map((targetType, index) => (
                <div
                  key={targetType.type}
                  className={`targets-nav-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => scrollToSlide(index)}
                  aria-label={`Go to ${targetType.label} targets`}
                />
              ))}
            </div>

            {/* Carousel */}
            <div className="targets-carousel-mobile">
              <Carousel
                className="w-full"
                setApi={setCarouselApi}
                opts={{
                  align: "center",
                  loop: false,
                }}
              >
                <CarouselContent className="-ml-2">
                  <CarouselItem className="pl-2">
                    {renderTargetColumn('tomorrow', tomorrowTargets, 'Tomorrow', 'Tasks for tomorrow')}
                  </CarouselItem>
                  <CarouselItem className="pl-2">
                    {renderTargetColumn('week', weekTargets, 'This Week', 'Weekly objectives')}
                  </CarouselItem>
                  <CarouselItem className="pl-2">
                    {renderTargetColumn('month', monthTargets, 'This Month', 'Monthly goals')}
                  </CarouselItem>
                  <CarouselItem className="pl-2">
                    {renderTargetColumn('year', yearTargets, 'This Year', 'Annual aspirations')}
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>

            {/* Current Section Label */}
            <div className="text-center mt-4">
              <p className="text-sm text-slate-400">
                {targetTypes[currentSlide]?.label} Targets
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderTargetColumn('tomorrow', tomorrowTargets, 'Tomorrow', 'Tasks for tomorrow')}
            {renderTargetColumn('week', weekTargets, 'This Week', 'Weekly objectives')}
            {renderTargetColumn('month', monthTargets, 'This Month', 'Monthly goals')}
            {renderTargetColumn('year', yearTargets, 'This Year', 'Annual aspirations')}
          </div>
        )}
      </div>
    </div>
  );
};

export default TargetsView;
