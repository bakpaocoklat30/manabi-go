import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

export async function cutAudio(inputPath: string, outputPath: string, startTime: number, endTime: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const duration = endTime - startTime;
    if (duration <= 0) {
      return reject(new Error('Durasi potong tidak valid.'));
    }

    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
}
