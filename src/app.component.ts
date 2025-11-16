import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageGeneratorComponent } from './components/image-generator/image-generator.component';
import { ImageAnalyzerComponent } from './components/image-analyzer/image-analyzer.component';
import { ImageEditorComponent } from './components/image-editor/image-editor.component';
import { VideoGeneratorComponent } from './components/video-generator/video-generator.component';
import { ImageAnimatorComponent } from './components/image-animator/image-animator.component';

export type Tool = 'dashboard' | 'image-generator' | 'image-analyzer' | 'image-editor' | 'video-generator' | 'image-animator';

interface ToolCard {
  id: Tool;
  title: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ImageGeneratorComponent,
    ImageAnalyzerComponent,
    ImageEditorComponent,
    VideoGeneratorComponent,
    ImageAnimatorComponent,
  ]
})
export class AppComponent {
  selectedTool = signal<Tool>('dashboard');

  readonly tools: ToolCard[] = [
    { id: 'image-generator', title: 'Image Generator', description: 'Create stunning visuals from text prompts with Imagen.', icon: 'brush', color: 'bg-blue-600' },
    { id: 'image-analyzer', title: 'Image Analyzer', description: 'Upload an image and ask questions about its content.', icon: 'search', color: 'bg-green-600' },
    { id: 'image-editor', title: 'Image Remixer', description: 'Remix an existing image with text-based instructions.', icon: 'edit', color: 'bg-indigo-600' },
    { id: 'video-generator', title: 'Video Generator', description: 'Bring your stories to life with text-to-video generation.', icon: 'movie', color: 'bg-purple-600' },
    { id: 'image-animator', title: 'Image Animator', description: 'Animate a static image with an optional text prompt.', icon: 'videocam', color: 'bg-pink-600' },
  ];

  selectTool(tool: Tool): void {
    this.selectedTool.set(tool);
  }
  
  get currentToolTitle(): string {
    if (this.selectedTool() === 'dashboard') {
      return 'AI Suite Dashboard';
    }
    return this.tools.find(t => t.id === this.selectedTool())?.title || 'AI Tool';
  }
}
