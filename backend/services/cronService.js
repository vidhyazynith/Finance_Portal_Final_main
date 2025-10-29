import cron from 'node-cron';
import Salary from '../models/Salary.js';

/**
 * Start the cron job for processing hike status updates
 * @returns {void}
 */
export const startHikeCronJob = () => {
  // Run every day at midnight to check for hike status updates
  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('🔄 Checking for salary hike status updates...');
      
      // This should now show proper types when hovering
      const result = await Salary.processHikeStatusUpdates();
      
      if (result.activated > 0 || result.disabled > 0) {
        console.log(`✅ Hike status update completed: ${result.activated} salary records activated, ${result.disabled} salary records disabled`);
      } else {
        console.log('✅ No hike status updates needed');
      }
    } catch (error) {
      console.error('❌ Error processing hike status updates:', error);
    }
  });

  console.log('✅ Hike status cron job started');
};

// /**
//  * Start the cron job for updating month/year of active salaries
//  * @returns {void}
//  */
// export const startMonthlyUpdateCronJob = () => {
//   // Runs at 00:15 AM on the 1st day of every month
//   cron.schedule('*/3 * * * *', async () => {
//     try {
//       const now = new Date();
//       const month = now.toLocaleDateString('en-US', { month: 'long' });
//       const year = now.getFullYear();

//       console.log(`🗓️ Updating active salaries to ${month} ${year}...`);

//       const result = await Salary.updateMany(
//         { activeStatus: 'enabled' },
//         { $set: { month, year } }
//       );

//       console.log(`✅ Monthly salary update complete — ${result.modifiedCount} records updated.`);
//     } catch (error) {
//       console.error('❌ Error updating monthly salaries:', error);
//     }
//   });

//   console.log('✅ Monthly salary cron job started');
// };