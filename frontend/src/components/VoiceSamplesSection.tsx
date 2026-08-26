import React from 'react';
import { MessageSquareQuote, Cpu, Sparkles } from 'lucide-react';
import { BrandVoiceSample } from '../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

interface VoiceSamplesSectionProps {
  samples: BrandVoiceSample[];
}

export const VoiceSamplesSection: React.FC<VoiceSamplesSectionProps> = ({ samples }) => {
  return (
    <Card className="border-indigo-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
            Extracted Brand Voice & Tone Samples ({samples.length})
          </CardTitle>
          <Badge variant="indigo">
            <Cpu className="w-3 h-3" /> MiniLM 384-d Vectorized
          </Badge>
        </div>
        <CardDescription>
          Tone of voice paragraphs extracted from brand guidelines or uploaded reference copy. These form the semantic anchor for downstream copy generation & compliance auditing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {samples.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No brand voice samples extracted yet. Guidelines mentioning voice/tone rules or sample approved copy will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map((sample, idx) => (
              <div
                key={sample.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Voice Anchor #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {sample.source.replace('_', ' ')}
                    </Badge>
                    <Badge variant="success" className="text-[10px]">
                      Vector Indexed
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed italic border-l-2 border-indigo-500/40 pl-3">
                  "{sample.sample_text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
