import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

type AspectRatio = '16:9' | '9:16';

@Component({
  selector: 'app-video-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoGeneratorComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  prompt = signal('');
  aspectRatio = signal<AspectRatio>('16:9');
  isLoading = signal(false);
  error = signal<string | null>(null);
  generatedVideoUrl = signal<string | null>(null);
  loadingMessage = signal('');
  
  readonly aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '16:9', label: 'Landscape' },
    { value: '9:16', label: 'Portrait' },
  ];

  updatePrompt(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.prompt.set(target.value);
  }

  setAspectRatio(ratio: AspectRatio) {
    this.aspectRatio.set(ratio);
  }

  async generateVideo() {
    if (!this.prompt() || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedVideoUrl.set(null);
    this.loadingMessage.set('Initializing...');
    
    const updateLoadingMessage = (msg: string) => this.loadingMessage.set(msg);

    try {
      const videoUri = await this.geminiService.generateVideo(this.prompt(), this.aspectRatio(), updateLoadingMessage);
      this.loadingMessage.set('Fetching final video...');
      const blobUrl = await this.geminiService.fetchVideoBlobUrl(videoUri);
      this.generatedVideoUrl.set(blobUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to generate video: ${errorMessage}`);
    } finally {
      this.isLoading.set(false);
      this.loadingMessage.set('');
    }
  }
  
  get safeVideoUrl(): SafeUrl | null {
    const url = this.generatedVideoUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
}
