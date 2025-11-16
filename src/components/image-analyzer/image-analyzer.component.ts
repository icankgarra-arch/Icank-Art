import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-image-analyzer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-analyzer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageAnalyzerComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  prompt = signal('');
  uploadedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  analysisResult = signal<string | null>(null);

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
      this.analysisResult.set(null);
      this.error.set(null);
    }
  }

  async analyzeImage() {
    const file = this.uploadedFile();
    if (!file || !this.prompt() || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    try {
      const base64 = await this.geminiService.fileToBase64(file);
      const result = await this.geminiService.analyzeImage(this.prompt(), base64, file.type);
      this.analysisResult.set(result);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to analyze image. Please check the console for details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  get safePreviewUrl(): SafeUrl | null {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
}
