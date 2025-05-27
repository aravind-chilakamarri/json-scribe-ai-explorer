
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { GitBranch, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function GitHubSync() {
  const [isCommitting, setIsCommitting] = useState(false);
  const { toast } = useToast();

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      // Simulate GitHub commit (in a real app, this would call GitHub API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Changes committed",
        description: "Your latest changes have been committed to GitHub",
      });
    } catch (error) {
      toast({
        title: "Commit failed",
        description: "Failed to commit changes to GitHub",
        variant: "destructive",
      });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCommit}
            disabled={isCommitting}
            variant="outline"
            size="sm"
            aria-label="Commit changes to GitHub"
          >
            {isCommitting ? (
              <Upload className="animate-spin" size={16} />
            ) : (
              <GitBranch size={16} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Commit to GitHub</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
