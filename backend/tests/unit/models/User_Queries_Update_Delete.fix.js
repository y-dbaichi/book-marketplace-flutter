// Complete fixed sections for User Queries, Update, and Deletion tests

const queryTests = `
  describe('User Queries', () => {
    beforeEach(async () => {
      // Create multiple users
      await User.create({
        email: 'buyer1@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      await User.create({
        email: 'buyer2@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567891',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '456 Test Ave'
        }
      });

      await User.create({
        email: 'seller1@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        phone: '+9876543210',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Store',
          address: '789 Store Blvd'
        }
      });
    });

    test('should find user by email', async () => {
      const user = await User.findOne({ email: 'buyer1@test.com' });

      expect(user).toBeDefined();
      expect(user.email).toBe('buyer1@test.com');
      expect(user.userType).toBe('buyer');
    });

    test('should find users by userType', async () => {
      const buyers = await User.find({ userType: 'buyer' });
      const sellers = await User.find({ userType: 'seller' });

      expect(buyers.length).toBe(2);
      expect(sellers.length).toBe(1);
    });

    test('should count users', async () => {
      const totalUsers = await User.countDocuments();
      const buyerCount = await User.countDocuments({ userType: 'buyer' });

      expect(totalUsers).toBe(3);
      expect(buyerCount).toBe(2);
    });
  });

  describe('User Update', () => {
    test('should update user profile', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      user.profile = {
        firstName: 'Updated',
        lastName: 'Name'
      };
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.profile.firstName).toBe('Updated');
      expect(updatedUser.profile.lastName).toBe('Name');
    });

    test('should update phone number', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      user.phone = '+9876543210';
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.phone).toBe('+9876543210');
    });

    test('should update location', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'seller',
        phone: '+1234567890',
        location: {
          coordinates: {
            latitude: 33.5731,
            longitude: -7.5898
          },
          name: 'Old Location',
          address: 'Old Address'
        }
      });

      user.location = {
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437
        },
        name: 'New Location',
        address: 'New Address'
      };
      await user.save();

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.location.name).toBe('New Location');
      expect(updatedUser.location.coordinates.latitude).toBe(34.0522);
    });
  });

  describe('User Deletion', () => {
    test('should delete user', async () => {
      const user = await User.create({
        email: 'test@test.com',
        password: 'TestPass123!',
        userType: 'buyer',
        phone: '+1234567890',
        location: {
          coordinates: { latitude: 33.5731, longitude: -7.5898 },
          name: 'Home',
          address: '123 Test St'
        }
      });

      await User.findByIdAndDelete(user._id);

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
`;

console.log(queryTests);
