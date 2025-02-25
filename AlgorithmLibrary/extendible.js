class Bucket {
  static nameCounter = -1;
  static getName() {
    this.nameCounter++;
    return String.fromCharCode('A'.charCodeAt(0) + this.nameCounter);
  }
  constructor(id, localDepth, capacity) {
    this.name = Bucket.getName();
    this.localDepth = localDepth;
    this.capacity = capacity;
    this.data = [];
    this.graphicId = id;
    this.x = -1;    // X and Y coordinates of the graphic
    this.y = -1;
  }

  isFull() {
    return this.data.length === this.capacity;
  }

  insert(value) {
    this.data.push(value);
  }

  split() {
    this.localDepth += 1;
    const newBucket = new Bucket(-1, this.localDepth, this.capacity);
    const middleBit = 1 << (this.localDepth-1);

    const newData = [];
    const newBucketData = [];

    for (const val of this.data) {
      if ((val & middleBit) === 0) { // Check the (localDepth)th bit
        newData.push(val);
      } else {
        newBucketData.push(val);
      }
    }

    this.data = newData;
    newBucket.data = newBucketData;

    return newBucket;
  }
}

class ExtendibleHashing {
  constructor(bucketCapacity) {
    this.globalDepth = 0;
    this.directory = [new Bucket(-1, 0, bucketCapacity)]; // Initial directory with one bucket
    this.bucketCapacity = bucketCapacity;
  }

  insert(value) {
    const bucketIndex = this.getBucketIndex(value);
    const bucket = this.directory[bucketIndex];

    if (bucket.isFull()) {
      if (bucket.localDepth === this.globalDepth) {
        this.doubleDirectory();
      }
      const newBucket = bucket.split();
      // console.log(`Created Bucket ${newBucket.name} l=${newBucket.localDepth} [${newBucket.data}] from Bucket ${bucket.name} l=${bucket.localDepth} [${bucket.data}]`);

      this.redistributePointers(bucketIndex, newBucket);
      this.insert(value); // Retry insertion after split
      return;
    }

    bucket.insert(value);
  }

  getBucketIndex(value) {
    const mask = (1 << this.globalDepth) - 1; // Create a mask for the relevant bits
    return value & mask; // Apply the mask to get the index
  }

  doubleDirectory() {
    const currLength = this.directory.length;
    for (let i = 0; i < currLength; i++) {
      this.directory.push(this.directory[i]);
    }
    this.globalDepth++;
  }

  redistributePointers(oldBucketIndex, newBucket) {
    const bucketCurrentLocalDepth = this.directory[oldBucketIndex].localDepth;
    const mask = (1 << bucketCurrentLocalDepth) - 1;  // Last (bucketCurrentLocalDepth) bits

    const oldBucketBits = oldBucketIndex & ((1<<(bucketCurrentLocalDepth-1))-1);  // Last (bucketCurrentLocalDepth-1) bits of the index number
    var newBucketBits = 1<<(bucketCurrentLocalDepth-1);
    newBucketBits += oldBucketBits; // Prepend 1 to oldBucketBits

    for (let i = 0; i < this.directory.length; i++) {

        if ((i & mask) === oldBucketBits) {
            this.directory[i] = this.directory[oldBucketIndex];
        }
        if ((i & mask) === newBucketBits) {
            this.directory[i] = newBucket;
        }
    }
  }

  printDirectory() {
    console.log("Directory (Global Depth:", this.globalDepth + "):");
    for (let i = 0; i < this.directory.length; i++) {
        const bucket = this.directory[i];
        console.log(`Index ${i}: Bucket ${bucket.name}, Local Depth ${bucket.localDepth}, Data: [${bucket.data.join(", ")}]`);
    }
  }
}



// Example usage:
const extendibleHashing = new ExtendibleHashing(2); // Bucket capacity of 2

var nums = [0,1,2,5,4,12,8,28,13];
// nums = [0,1,4,8,7,15];
for (const i of nums) {
  console.log(`Inserting ${i}...`);
  extendibleHashing.insert(i);
  extendibleHashing.printDirectory();
  console.log();
}

Bucket.nameCounter = -1;

