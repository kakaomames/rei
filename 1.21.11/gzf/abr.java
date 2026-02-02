import io.netty.buffer.ByteBuf;

public record abr(amo c, byte[] d) implements aay<abg> {
   public static final aao<wx, abr> a = aay.a(abr::a, abr::new);
   private static final int e = 5120;
   public static final aao<ByteBuf, byte[]> b = aam.a(5120);

   private abr(wx $$0) {
      this($$0.q(), (byte[])b.decode($$0));
   }

   public abr(amo param1, byte[] param2) {
      this.c = $$0;
      this.d = $$1;
   }

   private void a(wx $$0) {
      $$0.a(this.c);
      b.encode($$0, this.d);
   }

   public aba<abr> a() {
      return abu.k;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public amo b() {
      return this.c;
   }

   public byte[] e() {
      return this.d;
   }
}
