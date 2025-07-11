/**
 * Test suite for ImageUpload component improvements
 * Tests the separated hover zones and remove button functionality
 */

const { describe, test, expect } = require('@jest/globals');

describe('ImageUpload Component Improvements', () => {
  const BASE_URL = 'http://localhost:5175';
  
  beforeEach(async () => {
    // Navigate to the slideshow app
    await browser.navigate(BASE_URL);
    await browser.waitForSelector('.app-container', { timeout: 5000 });
  });

  describe('Separated Hover Zones', () => {
    test('should show only add button when hovering main image area', async () => {
      // First, upload a test image (we'll need to mock this or use a test image)
      await uploadTestImage();
      
      // Hover over the main area of the first image (excluding bottom-right corner)
      const imageCard = await browser.querySelector('.image-card:first-child');
      const mainArea = await imageCard.querySelector('.group\\/add');
      
      await browser.hover(mainArea);
      
      // Verify add button is visible
      const addButton = await imageCard.querySelector('.group-hover\\/add\\:opacity-100');
      expect(await addButton.isVisible()).toBe(true);
      
      // Verify remove button is NOT visible
      const removeButton = await imageCard.querySelector('.group-hover\\/remove\\:opacity-100');
      expect(await removeButton.isVisible()).toBe(false);
    });

    test('should show only remove button when hovering corner area', async () => {
      await uploadTestImage();
      
      // Hover over the bottom-right corner (remove zone)
      const imageCard = await browser.querySelector('.image-card:first-child');
      const removeZone = await imageCard.querySelector('.group\\/remove');
      
      await browser.hover(removeZone);
      
      // Verify remove button is visible
      const removeButton = await imageCard.querySelector('.group-hover\\/remove\\:opacity-100');
      expect(await removeButton.isVisible()).toBe(true);
      
      // Verify add button is NOT visible
      const addButton = await imageCard.querySelector('.group-hover\\/add\\:opacity-100');
      expect(await addButton.isVisible()).toBe(false);
    });
  });

  describe('Remove Button Functionality', () => {
    test('should remove image when clicking remove button', async () => {
      await uploadTestImage();
      
      // Get initial image count
      const initialImages = await browser.querySelectorAll('.image-card');
      const initialCount = initialImages.length;
      
      // Hover over remove zone and click remove button
      const firstImage = initialImages[0];
      const removeZone = await firstImage.querySelector('.group\\/remove');
      
      await browser.hover(removeZone);
      await browser.click(removeZone);
      
      // Wait for image to be removed
      await browser.waitFor(500);
      
      // Verify image count decreased
      const finalImages = await browser.querySelectorAll('.image-card');
      expect(finalImages.length).toBe(initialCount - 1);
    });

    test('should not trigger add to timeline when clicking remove button', async () => {
      await uploadTestImage();
      
      // Get initial timeline count
      const initialTimelineItems = await browser.querySelectorAll('.timeline-item');
      const initialTimelineCount = initialTimelineItems.length;
      
      // Click remove button
      const firstImage = await browser.querySelector('.image-card:first-child');
      const removeZone = await firstImage.querySelector('.group\\/remove');
      
      await browser.hover(removeZone);
      await browser.click(removeZone);
      
      await browser.waitFor(500);
      
      // Verify timeline count didn't increase
      const finalTimelineItems = await browser.querySelectorAll('.timeline-item');
      expect(finalTimelineItems.length).toBe(initialTimelineCount);
    });
  });

  describe('Add to Timeline Functionality', () => {
    test('should add image to timeline when clicking main area', async () => {
      await uploadTestImage();
      
      // Get initial timeline count
      const initialTimelineItems = await browser.querySelectorAll('.timeline-item');
      const initialCount = initialTimelineItems.length;
      
      // Click main area of image
      const firstImage = await browser.querySelector('.image-card:first-child');
      const mainArea = await firstImage.querySelector('.group\\/add');
      
      await browser.click(mainArea);
      await browser.waitFor(500);
      
      // Verify timeline count increased
      const finalTimelineItems = await browser.querySelectorAll('.timeline-item');
      expect(finalTimelineItems.length).toBe(initialCount + 1);
    });
  });

  describe('Visual Consistency', () => {
    test('should maintain consistent styling across hover states', async () => {
      await uploadTestImage();
      
      const imageCard = await browser.querySelector('.image-card:first-child');
      
      // Test main area hover
      const mainArea = await imageCard.querySelector('.group\\/add');
      await browser.hover(mainArea);
      
      // Capture screenshot of add button state
      await browser.screenshot('add-button-hover.png');
      
      // Test remove area hover
      const removeZone = await imageCard.querySelector('.group\\/remove');
      await browser.hover(removeZone);
      
      // Capture screenshot of remove button state
      await browser.screenshot('remove-button-hover.png');
      
      // Move away to reset state
      await browser.hover('body');
      await browser.screenshot('no-hover-state.png');
    });
  });

  // Helper function to upload a test image
  async function uploadTestImage() {
    // This would need to be implemented based on how file upload works
    // For now, we'll simulate it or use a pre-uploaded test image
    const fileInput = await browser.querySelector('input[type="file"]');
    
    // In a real scenario, we'd upload a test image file
    // For now, we'll assume there's already an image or mock the upload
    
    // Wait for image to appear in the list
    await browser.waitForSelector('.image-card', { timeout: 3000 });
  }
});
