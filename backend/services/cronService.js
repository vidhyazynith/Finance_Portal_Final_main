import cron from 'node-cron';
import Salary from '../models/Salary.js';

export const startHikeCronJob = () => {
  // Run every day at midnight to check for hike status updates
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🔄 Checking for salary hike status updates...');
      const result = await Salary.processHikeStatusUpdates();
      
      if (result.activated > 0 || result.disabled > 0) {
        console.log(`✅ Hike status update completed: ${result.activated} activated, ${result.disabled} disabled`);
      }
    } catch (error) {
      console.error('❌ Error processing hike status updates:', error);
    }
  });

  console.log('✅ Hike status cron job started');
};