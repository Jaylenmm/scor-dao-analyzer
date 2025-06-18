import { createClient } from '@supabase/supabase-js';

const supabaseURL = 'https://qbbbkrddkoitfvdoiecs.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseURL, supabaseAnonKey);

/**
 * Stores email signup in database
 * @param {string} email - User email address
 * @param {string} source - Where the signup came from
 * @returns {Promise<Object>} Success/error response
 */
export const storeEmailSignup = async (email, source = 'landing_page') => {
    try {
      console.log('Storing email signup:', email);
  
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
  
      // Get user info for analytics
      const userAgent = navigator.userAgent;
      
      const { data, error } = await supabase
        .from('email_signups')
        .insert([
          {
            email: email.toLowerCase().trim(),
            source,
            user_agent: userAgent,
            created_at: new Date().toISOString()
          }
        ])
        .select();
  
      if (error) {
        // Handle duplicate email gracefully
        if (error.code === '23505') { // Unique constraint violation
          console.log('Email already exists:', email);
          return {
            success: true,
            message: 'Email already registered',
            duplicate: true
          };
        }
        throw error;
      }
  
      console.log('Email stored successfully:', data);
      return {
        success: true,
        message: 'Email stored successfully',
        data: data[0]
      };
  
    } catch (error) {
      console.error('Database error:', error);
      return {
        success: false,
        message: error.message,
        error
      };
    }
  };
  
  /**
   * Gets email signup statistics (for admin/investor dashboard)
   * @returns {Promise<Object>} Email statistics
   */
  export const getEmailStats = async () => {
    try {
      const { data, error } = await supabase
        .from('email_signups')
        .select('*');
  
      if (error) throw error;
  
      // Calculate statistics
      const totalSignups = data.length;
      const today = new Date().toISOString().split('T')[0];
      const todaySignups = data.filter(signup => 
        signup.created_at.startsWith(today)
      ).length;
  
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const weeklySignups = data.filter(signup => 
        new Date(signup.created_at) >= last7Days
      ).length;
  
      // Group by source
      const sourceBreakdown = data.reduce((acc, signup) => {
        acc[signup.source] = (acc[signup.source] || 0) + 1;
        return acc;
      }, {});
  
      return {
        success: true,
        stats: {
          totalSignups,
          todaySignups,
          weeklySignups,
          sourceBreakdown,
          latestSignups: data.slice(-10).reverse() // Last 10 signups
        }
      };
  
    } catch (error) {
      console.error('Stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };