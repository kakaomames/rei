import io.netty.buffer.ByteBuf;

public record ajf(int b, boolean c) implements aay<aib> {
   public static final aao<ByteBuf, ajf> a;

   public ajf(int param1, boolean param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ajf> a() {
      return ahz.bW;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }

   static {
      a = aao.a(aam.h, ajf::b, aam.b, ajf::e, ajf::new);
   }
}
