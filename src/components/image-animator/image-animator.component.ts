import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-image-animator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-animator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageAnimatorComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  prompt = signal('');
  uploadedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  generatedVideoUrl = signal<string | null>(null);
  loadingMessage = signal('');

  updatePrompt(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.prompt.set(target.value);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (this.previewUrl()) {
        URL.revokeObjectURL(this.previewUrl()!);
      }
      this.uploadedFile.set(file);
      this.previewUrl.set(URL.createObjectURL(file));
      this.generatedVideoUrl.set(null);
      this.error.set(null);
    }
  }

  async animateImage() {
    const file = this.uploadedFile();
    if (!file || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedVideoUrl.set(null);
    this.loadingMessage.set('Initializing...');

    const updateLoadingMessage = (msg: string) => this.loadingMessage.set(msg);
    
    try {
      const base64 = await this.geminiService.fileToBase64(file);
      const videoUri = await this.geminiService.animateImage(this.prompt(), base64, file.type, updateLoadingMessage);
      this.loadingMessage.set('Fetching final video...');
      const blobUrl = await this.geminiService.fetchVideoBlobUrl(videoUri);
      this.generatedVideoUrl.set(blobUrl);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(`Failed to animate image: ${errorMessage}`);
    } finally {
      this.isLoading.set(false);
      this.loadingMessage.set('');
    }
  }

  get safePreviewUrl(): SafeUrl | null {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
  
  get safeVideoUrl(): SafeUrl | null {
    const url = this.generatedVideoUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
}
