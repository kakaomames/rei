import io.netty.buffer.ByteBuf;

public record aif(ccz b) implements aay<aib> {
   public static final aao<ByteBuf, aif> a;

   public aif(ccz param1) {
      this.b = $$0;
   }

   public aba<aif> a() {
      return ahz.bt;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public ccz b() {
      return this.b;
   }

   static {
      a = aao.a(ccz.f, aif::b, aif::new);
   }
}
