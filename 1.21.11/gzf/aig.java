import io.netty.buffer.ByteBuf;

public record aig(dwl b) implements aay<aib> {
   public static final aao<ByteBuf, aig> a;

   public aig(dwl param1) {
      this.b = $$0;
   }

   public aba<aig> a() {
      return ahz.bu;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public dwl b() {
      return this.b;
   }

   static {
      a = aao.a(dwl.g, aig::b, aig::new);
   }
}
