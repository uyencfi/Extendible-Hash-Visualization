# Extendible Hash Visualization

[Extendible Hashing](https://en.wikipedia.org/wiki/Extendible_hashing) powers the indexing structures of many DBMS.
This visualization demonstrates how this scheme dynamically manages data storage, including bucket splitting, directory expansion, and bucket merging.

Available at https://uyencfi.github.io/Extendible-Hash-Visualization/

## Properties
 - On an insert operation with overflow, a bucket may be split multiple times. Multiple bucket splits happen when the previous splits did not resolve the overflow (i.e., All data entries either stayed in the old bucket, or all moved to the split image). This ensures that no overflow pages are needed, at the cost of having empty buckets (they are the buckets that were created but did not help resolve the overflow).

 - Overflow pages: are not needed. Each bucket access cost is bounded to 1 I/O operations.
    - **Except** when there are collisions, and the number of collisions exceed bucket capacity (see below).

 - Handling collisions: Collisions are defined as two data entries having the **exact same** hash value. This means that during an overflow, no matter how many times a bucket is split, the collisions will still hash to the same bucket, and overflow can never be resolved. 
    - Currently: reject any insertion that causes too many collisions and infinite splitting.
    - TODO: When the number of collisions exceed bucket capacity, allow the bucket to have overflow page(s).

 - On a delete operation, buckets will be merged if their combined data entries fit into a single bucket. This is a stronger property than only merging a bucket when it becomes empty.

## Running locally
The visualization works by using an HTML file for animation, and JavaScript for handling the insertion/deletion events.
```bash
git clone https://github.com/uyencfi/Extendible-Hash-Visualization.git
cd Extendible-Hash-Visualization
```
Then open `index.html` in a browser.

## Acknowledgement
This is an extension of the code provided by [USF Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/about.html). While the base animation library is by USF, the extendible hashing structure and animation tweaks are by me.
