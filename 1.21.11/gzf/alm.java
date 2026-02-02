import io.netty.buffer.ByteBuf;

public class alm implements aay<all> {
   public static final aao<ByteBuf, alm> a = aay.a(alm::a, alm::new);
   private final long b;

   public alm(long $$0) {
      this.b = $$0;
   }

   private alm(ByteBuf $$0) {
      this.b = $$0.readLong();
   }

   private void a(ByteBuf $$0) {
      $$0.writeLong(this.b);
   }

   public aba<alm> a() {
      return alk.b;
   }

   public void a(all $$0) {
      $$0.a(this);
   }

   public long b() {
      return this.b;
   }
}
