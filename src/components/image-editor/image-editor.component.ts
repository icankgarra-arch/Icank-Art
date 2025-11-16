import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageEditorComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  prompt = signal('');
  uploadedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  resultImageUrl = signal<string | null>(null);

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
      this.resultImageUrl.set(null);
      this.error.set(null);
    }
  }

  async editImage() {
    const file = this.uploadedFile();
    if (!file || !this.prompt() || this.isLoading()) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.resultImageUrl.set(null);

    try {
      const base64 = await this.geminiService.fileToBase64(file);
      // NOTE: This is a simulation of editing. The service will use the prompt
      // and image analysis to generate a *new* image.
      const imageUrl = await this.geminiService.editImage(this.prompt(), base64, file.type);
      this.resultImageUrl.set(imageUrl);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to remix image. Please check the console for details.');
    } finally {
      this.isLoading.set(false);
    }
  }

  get safePreviewUrl(): SafeUrl | null {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
  
  get safeResultImageUrl(): SafeUrl | null {
    const url = this.resultImageUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  }
}
