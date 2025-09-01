"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HiCheckCircle, HiClock } from 'react-icons/hi2';

interface ProfileSection {
  id: string;
  label: string;
  completed: boolean;
  actionText: string;
  icon: any;
  color: string;
}

interface ProfileCompletionCardProps {
  completionPercentage: number;
  sections: ProfileSection[];
}

export function ProfileCompletionCard({ completionPercentage, sections }: ProfileCompletionCardProps) {
  const completedSections = sections.filter(section => section.completed).length;
  const totalSections = sections.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Profile Completion
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"} className="text-xs">
            {completionPercentage}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{completedSections}/{totalSections} sections</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    section.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {section.completed ? (
                      <HiCheckCircle className="w-4 h-4" />
                    ) : (
                      <IconComponent className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{section.label}</p>
                    <p className="text-xs text-gray-500">{section.actionText}</p>
                  </div>
                </div>
                {section.completed ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Complete
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Pending
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {completionPercentage < 100 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 text-center">
              Complete your profile to attract more brand collaborations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
