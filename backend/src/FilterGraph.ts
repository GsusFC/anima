/**
 * AnimaGen Backend - FilterGraph Module
 * 
 * This module provides a class for building complex FFmpeg filter graphs,
 * handling transitions, effects, and timing for video processing operations.
 */

import { FilterGraphOptions } from './types';

/**
 * FilterGraph class for building complex FFmpeg filter chains
 */
export class FilterGraph {
  private filters: string[] = [];
  private inputs: string[] = [];
  private outputs: string[] = [];
  private lastLabel: string = '';
  private width: number;
  private height: number;
  private fps: number;
  private duration: number;

  /**
   * Create a new FilterGraph instance
   * @param options Configuration options for the filter graph
   */
  constructor(options: FilterGraphOptions) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.fps = options.fps || 30;
    this.duration = options.duration || 3;
  }

  /**
   * Add an input to the filter graph
   * @param input Input label
   * @returns This FilterGraph instance for chaining
   */
  addInput(input: string): FilterGraph {
    this.inputs.push(input);
    return this;
  }

  /**
   * Add a filter to the graph
   * @param filter Filter string in FFmpeg syntax
   * @returns This FilterGraph instance for chaining
   */
  addFilter(filter: string): FilterGraph {
    this.filters.push(filter);
    return this;
  }

  /**
   * Set the output label
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  setOutput(output: string): FilterGraph {
    this.outputs.push(output);
    this.lastLabel = output;
    return this;
  }

  /**
   * Add a scale filter
   * @param width Target width (default: instance width)
   * @param height Target height (default: instance height)
   * @param input Input label (default: last output)
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  scale(width?: number, height?: number, input?: string, output?: string): FilterGraph {
    const w = width || this.width;
    const h = height || this.height;
    const inp = input || this.lastLabel;
    const out = output || `scaled_${this.filters.length}`;
    
    this.addFilter(`${inp}scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Add a setpts filter for timing control
   * @param pts PTS expression
   * @param input Input label (default: last output)
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  setpts(pts: string, input?: string, output?: string): FilterGraph {
    const inp = input || this.lastLabel;
    const out = output || `pts_${this.filters.length}`;
    
    this.addFilter(`${inp}setpts=${pts}[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Add a trim filter
   * @param start Start time in seconds
   * @param duration Duration in seconds
   * @param input Input label (default: last output)
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  trim(start: number, duration: number, input?: string, output?: string): FilterGraph {
    const inp = input || this.lastLabel;
    const out = output || `trim_${this.filters.length}`;
    
    this.addFilter(`${inp}trim=start=${start}:duration=${duration},setpts=PTS-STARTPTS[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Add a fade in effect
   * @param duration Fade duration in seconds
   * @param input Input label (default: last output)
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  fadeIn(duration: number, input?: string, output?: string): FilterGraph {
    const inp = input || this.lastLabel;
    const out = output || `fadein_${this.filters.length}`;
    
    this.addFilter(`${inp}fade=t=in:st=0:d=${duration}[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Add a fade out effect
   * @param duration Fade duration in seconds
   * @param totalDuration Total clip duration in seconds
   * @param input Input label (default: last output)
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  fadeOut(duration: number, totalDuration: number, input?: string, output?: string): FilterGraph {
    const inp = input || this.lastLabel;
    const out = output || `fadeout_${this.filters.length}`;
    const startTime = totalDuration - duration;
    
    this.addFilter(`${inp}fade=t=out:st=${startTime}:d=${duration}[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Add a transition between two inputs
   * @param inputA First input label
   * @param inputB Second input label
   * @param type Transition type (fade, wipe, etc.)
   * @param duration Transition duration in seconds
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  transition(inputA: string, inputB: string, type: string, duration: number, output?: string): FilterGraph {
    const out = output || `trans_${this.filters.length}`;
    
    this.addFilter(`${inputA}${inputB}xfade=transition=${type}:duration=${duration}:offset=0[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Add a concat filter to join multiple inputs
   * @param inputs Array of input labels
   * @param output Output label
   * @returns This FilterGraph instance for chaining
   */
  concat(inputs: string[], output?: string): FilterGraph {
    const out = output || `concat_${this.filters.length}`;
    const inputStr = inputs.join('');
    
    this.addFilter(`${inputStr}concat=n=${inputs.length}:v=1:a=0[${out}]`);
    this.lastLabel = `[${out}]`;
    
    return this;
  }

  /**
   * Build a transition chain for multiple inputs
   * @param inputs Array of input labels
   * @param transitionType Type of transition
   * @param transitionDuration Duration of each transition in seconds
   * @param frameDurations Array of frame durations in seconds
   * @param output Final output label
   * @returns The final output label
   */
  buildTransitionChain(
    inputs: string[],
    transitionType: string,
    transitionDuration: number,
    frameDurations: number[],
    output?: string
  ): string {
    if (inputs.length === 1) {
      return inputs[0];
    }
    
    let lastOutput = inputs[0];
    let totalTime = 0;
    
    for (let i = 0; i < inputs.length - 1; i++) {
      const currentDuration = frameDurations[i] || this.duration;
      const nextInput = inputs[i + 1];
      const outputLabel = (i === inputs.length - 2) ? (output || '[outv]') : `[t${i}]`;
      
      // Add current frame duration to total time
      totalTime += currentDuration;
      
      // Calculate offset (transition starts at end of current frame minus transition duration)
      const offset = Math.max(totalTime - transitionDuration, 0);
      
      // Create xfade filter
      this.addFilter(
        `${lastOutput}${nextInput}xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel}`
      );
      
      lastOutput = outputLabel;
    }
    
    return lastOutput;
  }

  /**
   * Get the complete filter graph as a string
   * @returns Filter graph string for FFmpeg
   */
  getFilterGraph(): string {
    return this.filters.join(';');
  }

  /**
   * Get all filters as an array
   * @returns Array of filter strings
   */
  getFilters(): string[] {
    return this.filters;
  }

  /**
   * Get the last output label
   * @returns Last output label
   */
  getLastOutput(): string {
    return this.lastLabel;
  }

  /**
   * Reset the filter graph
   */
  reset(): void {
    this.filters = [];
    this.inputs = [];
    this.outputs = [];
    this.lastLabel = '';
  }
}

export default FilterGraph;
