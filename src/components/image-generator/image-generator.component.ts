import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

@Component({
  selector: 'app-image-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGeneratorComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  prompt = signal('');
  aspectRatio = signal<AspectRatio>('1:1');
  isLoading = signal(false);
  error = signal<string | null>(null);
  generatedImageUrl = signal<string | null>(null);
  
  readonly aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'Square' },
    { value: '16:9', label: 'Landscape' },
    { value: '9:16', label: 'Portrait' },
    { value: '4:3', label: 'Wide' },
    { value: '3:4', label: 'Tall' },
  ];

  updatePrompt(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.prompt.set(target.value);
  }

  setAspectRatio(ratio: AspectRatio) {
    this.aspectRatio.set(ratio);
  }

  async generateImage() {
    if (!this.prompt() || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedImageUrl.set(null);

    try {
      const imageUrl = await this.geminiService.generateImage(this.prompt(), this.aspectRatio());
      this.generatedImageUrl.set(imageUrl);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to generate image. Please check the console for details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  get safeImageUrl(): SafeUrl | null {
    const url = this.generatedImageUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
}
