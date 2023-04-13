pub use std::io::Result;


/// Whether an IO operation is ready for reading/writing or would block.
#[derive(Copy, Clone, Debug, ...)]
enum NonBlocking<T> {
    Ready(T),
    WouldBlock,
}


trait Ready {
	async fn ready(&mut self, interest: Interest) -> Result<Readiness>;
}

/// A buffer that is read into from a reader, and keeps track of how full it is.
/// This allows abstraction between direct pre-allocated buffers, gradually-allocating buffers, or fetching buffers from a buffer queue.
trait ReadBufAllocator {
	fn alloc(&mut self) -> ReadBuf;
}

/// A buffer that is written to a writer, and keeps track of how much as been written.
trait WriteBuf {
	
}

/// An object that can be read from
pub trait Read {
	async fn read_allocate<B: ReadBufAllocator>(&mut self, factory: &mut ReadBufAllocator) -> Result<B::Buffer>;
	/// Is an async function, must be awaited on an executor
	/// Takes a buffer (or buffer constructor) that may be read into.
	async fn read(&mut self, buffer: &mut ReadBuf) -> Result<()>;
}

pub trait Write {
	async fn write<B: WriteBuf>(&mut self, buffer: &B) -> Result<()>;
}



/* 
pub trait Read: Ready {
    fn non_blocking_read_buf(&mut self, buf: &mut impl ReadBuf) -> Result<NonBlocking<()>>;

    async fn read(&mut self, buf: &mut [u8]) -> Result<usize>;
    async fn read_buf(&mut self, buf: &mut ReadBuf<'_>) -> Result<())> { ... }
    async fn read_exact(&mut self, buf: &mut [u8]) -> Result<()> { ... }
    async fn read_buf_exact(&mut self, buf: &mut ReadBuf<'_>) -> Result<()> { ... }
    async fn read_buf_vectored(&mut self, bufs: &mut ReadBufVec<'_>) -> Result<usize> { ... }
    async fn read_to_end(&mut self, buf: &mut Vec<u8>) -> Result<usize> { ... }
    async fn read_to_string(&mut self, buf: &mut String) -> Result<usize> { ... }

    fn is_read_vectored(&self) -> bool { ... }

    fn by_ref(&mut self) -> &mut Self
    where
        Self: Sized,
    { ... }
} */

/// A think that can be written to some IO
trait WritableBuffer {
	fn advance(&self, amount: usize) -> Self;
}

/// An object that can be periodically written to. Like a file or network socket.
trait Write {
	/// A buffer that can be used to store data to be written to the object
	type Buffer: WritableBuffer;
	/// An error that may be returned if the write is not successful
	type Error: std::error::Error;
	// Pass buffer and get same object back and number of bytes written.
	fn write(&mut self, buffer: &Self::Buffer) -> Result<usize, Self::Error>;
}

trait SliceWrite = Write<Buffer = &[u8]>;

trait Read {
	type Buffer: ReadableBuffer;
	type Error;

}